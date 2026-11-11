# 백엔드 연동 계층 설계

## 목적

화면 작업이 바로 얹힐 수 있도록 백엔드(mediprice-backend) 연동의 기반을 만든다. UI는 만들지 않는다. 성공 기준은 다음과 같다.

- 백엔드가 바뀌면 명령 하나로 타입이 동기화되고, 호출하는 코드는 타입 오류로 변경을 알게 된다.
- 로그인한 사용자의 요청에 토큰이 자동으로 붙고, 만료되면 사용자가 모르게 재발급된다.
- 실패 응답을 일관된 에러 객체로 다룰 수 있다.
- 새 도메인을 추가할 때 따라 할 쿼리 작성 규칙이 코드로 존재한다.

## 확인된 전제 (백엔드)

- 인증은 Google OAuth. 로그인 성공 시 백엔드가 `OAUTH2_REDIRECT_URI`로 리다이렉트하며 `#accessToken=…&refreshToken=…&expiresIn=…`을 fragment로 넘기고, 실패하면 `#error=OAUTH2_LOGIN_FAILED`를 넘긴다. 쿠키는 쓰지 않는다.
- 로그인 시작 주소는 `{API_URL}/oauth2/authorization/google`이다.
- API 호출은 `Authorization: Bearer {accessToken}`. Access 만료는 1시간, Refresh는 14일이다.
- 재발급 `POST /api/auth/refresh` 본문 `{refreshToken}` → `{accessToken, refreshToken, tokenType, expiresIn}`. 로그아웃 `POST /api/auth/logout` 본문 `{refreshToken}` → 204.
- 실패 응답은 `{code, message, errors: [{field, reason}]}`이고, 인증 실패 코드는 `UNAUTHORIZED`, `INVALID_ACCESS_TOKEN`, `EXPIRED_ACCESS_TOKEN`(401), `INVALID_REFRESH_TOKEN`, `EXPIRED_REFRESH_TOKEN`(401), `ACCESS_DENIED`(403)이다.
- `/api-docs`는 응답 스키마의 모든 프로퍼티를 required로, null 가능 필드를 `T | null`로 내보낸다(백엔드 PR #13). 에러 응답 형식은 스펙에 없다.
- CORS는 백엔드의 `CORS_ALLOWED_ORIGINS`에 등록된 출처만 허용한다. 허용 헤더는 `Authorization`, `Content-Type`이다.

## 결정

| 주제      | 결정                                                                                              | 이유                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 타입·호출 | openapi-typescript로 타입 생성, openapi-fetch로 호출                                              | 스펙에서 타입을 자동 동기화하고, 훅과 캐시 규칙은 직접 통제                                                |
| 생성 파일 | `src/lib/api/schema.d.ts`를 커밋                                                                  | 백엔드 변경이 PR diff에 드러남                                                                             |
| 토큰 보관 | Access는 메모리, Refresh는 localStorage                                                           | 구조가 단순하고 백엔드 변경이 없음. XSS 시 Refresh가 노출될 수 있으므로 CSP와 의존성 관리를 별도 과제로 둠 |
| 만료 처리 | 401 `EXPIRED_ACCESS_TOKEN`이면 재발급 후 1회 재시도, 동시 요청은 재발급 1회로 합침(single-flight) | 중복 재발급 방지                                                                                           |
| 에러      | zod로 검증해 `ApiError`로 변환                                                                    | 스펙에 없는 형식이라 런타임 검증이 필요                                                                    |
| 쿼리      | 도메인별 `queryOptions`와 쿼리 키 팩토리                                                          | 캐시 키 일관성, 서버·클라이언트 공용                                                                       |

## 구성

```
src/
  env.ts                         NEXT_PUBLIC_API_URL을 필수로 변경
  lib/
    api/
      schema.d.ts                생성물 (pnpm api:generate)
      client.ts                  openapi-fetch 클라이언트 + 인증 미들웨어
      errors.ts                  ErrorResponse zod 스키마, ApiError
      refresh.ts                 single-flight 재발급
    auth/
      token-store.ts             zustand. access는 메모리, refresh는 localStorage
      oauth.ts                   loginUrl(), parseOAuthCallbackHash()
      session.ts                 signIn(tokens), signOut(), restoreSession()
  features/
    regions/queries.ts           쿼리 규칙의 예시 (시도·시군구)
    hospitals/queries.ts         쿼리 규칙의 예시 (검색·상세)
```

### 클라이언트 (`client.ts`)

- 베이스 URL은 `env.NEXT_PUBLIC_API_URL`.
- 요청 미들웨어: 저장소에 Access가 있으면 `Authorization: Bearer`를 붙인다. `/api/auth/refresh`와 `/api/auth/logout`에는 붙이지 않는다.
- 응답 미들웨어: 401이고 본문 `code`가 `EXPIRED_ACCESS_TOKEN`이면 `refresh()`를 기다린 뒤 원래 요청을 새 토큰으로 한 번만 다시 보낸다. 재시도한 요청이 다시 401이면 그대로 돌려준다. 재발급이 실패하면 `signOut()`을 호출한다.
- 다른 4xx·5xx는 `ApiError`로 변환해 던지는 래퍼(`apiFetch` 또는 `unwrap`)를 통해 호출부에 전달한다.

### 재발급 (`refresh.ts`)

- 진행 중인 재발급 Promise가 있으면 같은 Promise를 돌려준다(single-flight).
- Refresh가 없으면 즉시 실패한다. 성공하면 새 Access와 Refresh를 저장소에 반영한다(백엔드가 둘 다 새로 내려준다).
- `INVALID_REFRESH_TOKEN`, `EXPIRED_REFRESH_TOKEN`이면 저장소를 비우고 실패로 처리한다. 네트워크 오류는 저장소를 비우지 않는다.

### 인증 (`auth/`)

- `token-store`: `accessToken`(메모리), `refreshToken`(localStorage 키 `mediprice.refreshToken`와 동기화), `status`(`unknown` | `anonymous` | `authenticated`).
- `parseOAuthCallbackHash(hash)`: `{ ok: true, accessToken, refreshToken, expiresIn }` 또는 `{ ok: false, code }`를 돌려주는 순수 함수. 값이 빠졌거나 형식이 맞지 않으면 `ok: false`.
- `signIn(tokens)`: 저장소에 반영하고 주소창의 fragment를 지운다(`history.replaceState`).
- `restoreSession()`: 앱 시작 시 localStorage의 Refresh로 재발급을 시도해 Access를 복원한다. 실패하면 `anonymous`.
- `signOut()`: Refresh가 있으면 `/api/auth/logout`을 호출하고(실패해도 무시), 저장소를 비운다.

### 에러 (`errors.ts`)

- `ErrorResponse` zod 스키마: `{code: string, message: string, errors: {field: string, reason: string}[]}`.
- `ApiError`: `status`, `code`, `message`, `fieldErrors`를 가진다. 본문이 형식에 맞지 않으면 `code: 'UNKNOWN'`으로 변환한다. 네트워크 오류는 `NetworkError`로 구분한다.

### 쿼리 규칙 (`features/*/queries.ts`)

- 키 팩토리: `regionKeys.all`, `regionKeys.sggu(sidoCode)`처럼 도메인 단위 계층 키.
- `queryOptions({ queryKey, queryFn })`를 export하고, `queryFn`은 `client`를 호출해 에러를 `ApiError`로 던지게 한다.
- 훅은 만들지 않는다. 화면에서 `useQuery(regionQueries.sido())`로 쓴다(서버 prefetch에서도 같은 옵션을 재사용).
- 이번에는 `regions`와 `hospitals`(검색·상세)만 만든다. 나머지는 화면을 만들 때 같은 패턴으로 추가한다.

### 설정

- `NEXT_PUBLIC_API_URL`을 필수로 바꾸고 `.env.example`에 예시(`http://localhost:8080`)를 넣는다.
- `package.json` 스크립트: `api:generate`는 `openapi-typescript {API_URL}/api-docs -o src/lib/api/schema.d.ts`. 로컬 백엔드 또는 dev 서버를 대상으로 실행한다.
- 의존성 추가: `openapi-fetch`, `openapi-typescript`(dev), `vitest`(dev). `msw`, `zod`, `zustand`, `@tanstack/react-query`는 이미 설치돼 있다.
- `knip` 예외 목록에서 이번에 사용하는 `zustand`, `msw`를 제거한다.

## 테스트 (vitest + msw)

- 요청에 Bearer가 붙는다. 인증 엔드포인트에는 붙지 않는다.
- `EXPIRED_ACCESS_TOKEN` 401이면 재발급 후 같은 요청을 새 토큰으로 한 번 재시도한다.
- 동시에 만료된 요청 N개에서 재발급은 1회만 호출된다.
- `EXPIRED_REFRESH_TOKEN`이면 저장소가 비워지고 요청은 실패한다. 네트워크 오류로 재발급이 실패하면 저장소는 유지된다.
- 재시도한 요청이 다시 401이면 무한 반복하지 않는다.
- 에러 본문이 `ApiError`로 변환된다(필드 에러 포함, 형식이 맞지 않는 본문은 `UNKNOWN`).
- `parseOAuthCallbackHash`가 성공, 값 누락, `#error=…`, 잘못된 `expiresIn`을 처리한다.
- `restoreSession`이 Refresh가 있을 때 성공하고, 없거나 만료되면 `anonymous`가 된다.
- 검증: `pnpm check`(lint, typecheck, format, knip)와 `pnpm test`가 통과한다.

## 범위 밖

- 화면, 라우트 UI, OAuth 콜백 페이지(위 함수를 호출하는 얇은 페이지는 화면 작업에서 추가)
- Next.js BFF, httpOnly 쿠키, 서버 컴포넌트에서의 인증 호출
- 후기·마이페이지·관리자 쿼리(화면 작업에서 같은 패턴으로 추가)
- CSP 헤더 강화(Refresh의 localStorage 보관에 따른 후속 과제)

## 위험과 후속

- Refresh Token이 localStorage에 있어 XSS에 노출될 수 있다. CSP 도입, 외부 스크립트 최소화, 의존성 점검을 후속 과제로 둔다. 민감한 의료 프로필을 다루므로 BFF 전환을 이후에 재검토한다.
- 백엔드 스펙이 바뀌면 `pnpm api:generate`를 다시 실행하고 타입 오류를 해결해야 한다. CI에서 스펙 동기화를 검증할지는 별도로 결정한다.
- 백엔드 CORS에 프론트 출처가 등록돼 있어야 브라우저에서 호출할 수 있다. 배포 환경별 `CORS_ALLOWED_ORIGINS`를 확인해야 한다.
