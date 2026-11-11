# 백엔드 연동 계층 설계

## 목적

화면 작업이 바로 얹힐 수 있도록 백엔드(mediprice-backend) 연동의 기반을 만든다. UI는 만들지 않는다. 성공 기준은 다음과 같다.

- 백엔드가 바뀌면 명령 하나로 타입이 동기화되고, 호출하는 코드는 타입 오류로 변경을 알게 된다.
- 브라우저의 JavaScript는 토큰을 읽을 수 없다. 로그인한 사용자의 요청에 토큰이 자동으로 붙고, 만료되면 사용자가 모르게 재발급된다.
- 실패 응답을 일관된 에러 객체로 다룰 수 있다.
- 새 도메인을 추가할 때 따라 할 쿼리 작성 규칙이 코드로 존재한다.

## 확인된 전제 (백엔드)

- 인증은 Google OAuth. 로그인 성공 시 백엔드가 `OAUTH2_REDIRECT_URI`로 리다이렉트하며 `#accessToken=…&refreshToken=…&expiresIn=…`을 fragment로 넘기고, 실패하면 `#error=OAUTH2_LOGIN_FAILED`를 넘긴다. 쿠키는 쓰지 않는다.
- 로그인 시작 주소는 `{API_URL}/oauth2/authorization/google`이다.
- API 호출은 `Authorization: Bearer {accessToken}`. Access 만료는 1시간(`expiresIn` 초 단위로 내려옴), Refresh는 14일이다.
- 재발급 `POST /api/auth/refresh` 본문 `{refreshToken}` → `{accessToken, refreshToken, tokenType, expiresIn}`. 두 토큰이 모두 새로 내려온다. 로그아웃 `POST /api/auth/logout` 본문 `{refreshToken}` → 204.
- 실패 응답은 `{code, message, errors: [{field, reason}]}`이고, 인증 실패 코드는 `UNAUTHORIZED`, `INVALID_ACCESS_TOKEN`, `EXPIRED_ACCESS_TOKEN`(401), `INVALID_REFRESH_TOKEN`, `EXPIRED_REFRESH_TOKEN`(401), `ACCESS_DENIED`(403)이다.
- `/api-docs`는 응답 스키마의 모든 프로퍼티를 required로, null 가능 필드를 `T | null`로 내보낸다(백엔드 PR #13). 에러 응답 형식은 스펙에 없다.

## 결정

| 주제          | 결정                                                                                          | 이유                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 타입·호출     | openapi-typescript로 타입 생성, openapi-fetch로 호출                                          | 스펙에서 타입을 자동 동기화하고, 훅과 캐시 규칙은 직접 통제                             |
| 생성 파일     | `src/lib/api/schema.d.ts`를 커밋                                                              | 백엔드 변경이 PR diff에 드러남                                                          |
| 토큰 보관     | **Next.js BFF + httpOnly 쿠키**. 토큰은 브라우저 JS에 노출되지 않는다                         | localStorage는 XSS에 토큰이 탈취된다. 의료 프로필 같은 민감 정보를 다루므로 쿠키로 보관 |
| 브라우저 통신 | 브라우저는 같은 출처의 `/bff/**`만 호출하고, Next가 쿠키의 토큰을 붙여 백엔드로 중계한다      | CORS 설정이 필요 없고, 토큰이 JS를 거치지 않음                                          |
| 만료 처리     | 401이면 `/bff/session/refresh`를 호출(브라우저에서 single-flight)한 뒤 원래 요청을 1회 재시도 | Refresh가 회전되므로 재발급을 한 곳에서 한 번만 수행해야 경쟁 상태가 없음               |
| 에러          | zod로 검증해 `ApiError`로 변환                                                                | 스펙에 없는 형식이라 런타임 검증이 필요                                                 |
| 쿼리          | 도메인별 `queryOptions`와 쿼리 키 팩토리                                                      | 캐시 키 일관성(브라우저 전용 — 서버 prefetch는 후속)                                    |

## 요청 흐름

```
브라우저 ──(쿠키 자동 전송)──▶ Next /bff/api/hospitals ──(Authorization 첨부)──▶ 백엔드 /api/hospitals
                                   ▲  쿠키: mp_access, mp_refresh (httpOnly)
```

- 로그인: 브라우저가 `{API_URL}/oauth2/authorization/google`로 이동한다(백엔드와 직접 통신). 성공하면 백엔드가 프론트의 `/oauth/callback#…`로 돌려보낸다.
- 콜백 페이지는 fragment의 토큰을 읽어 `POST /bff/session`으로 한 번 전달하고 fragment를 지운다. BFF가 httpOnly 쿠키를 설정한다. 토큰은 이 순간에만 JS 메모리를 지나가며 어디에도 저장하지 않는다. (백엔드가 직접 쿠키를 내려주는 방식은 도메인 구성이 확정되지 않아 후속 과제로 둔다.)
- 이후 모든 호출은 `/bff/api/**`로 보내고, BFF가 쿠키의 Access를 `Authorization`으로 바꿔 백엔드에 전달한다.

## 구성

```
src/
  env.ts                          NEXT_PUBLIC_API_URL을 필수로 변경
  app/
    bff/
      api/[...path]/route.ts      백엔드 /api/** 중계 (모든 HTTP 메서드)
      session/route.ts            POST: 쿠키 설정(로그인), GET: 상태, DELETE: 로그아웃
      session/refresh/route.ts    POST: 쿠키의 Refresh로 재발급 후 쿠키 갱신
  server/bff/                     서버 전용(server-only)
    cookies.ts                    쿠키 이름·옵션, 읽기·쓰기·삭제
    upstream.ts                   백엔드 호출, 요청 헤더 정리, Origin 검사
    refresh-session.ts            Refresh로 재발급, 결과 → 쿠키·응답 변환(두 라우트가 공유)
    responses.ts                  no-store 응답과 공통 에러 응답
  lib/
    api/
      schema.d.ts                 생성물 (pnpm api:generate)
      client.ts                   openapi-fetch 클라이언트(baseUrl '/bff') + 401 재시도
      refresh.ts                  브라우저 single-flight 재발급
      errors.ts                   ErrorResponse zod 스키마, ApiError, NetworkError
      unwrap.ts                   openapi-fetch 결과를 데이터 또는 예외로 변환
      query.ts                    쿼리 직렬화(조건 객체를 평평하게, 배열은 쉼표)
      paths.ts                    BFF_BASE('/bff')
      session-events.ts           세션 만료 이벤트(subscribeSessionExpired)
  features/
    auth/
      oauth.ts                    loginUrl(), parseOAuthCallbackHash()
      session.ts                  completeOAuthCallback(), signOut(), getSession()
    regions/queries.ts            쿼리 규칙의 예시 (시도·시군구)
    hospitals/queries.ts          쿼리 규칙의 예시 (검색·상세)
```

### 쿠키 (`server/bff/cookies.ts`)

| 쿠키         | 값      | 속성                                                               | 수명                   |
| ------------ | ------- | ------------------------------------------------------------------ | ---------------------- |
| `mp_access`  | Access  | `HttpOnly`, `SameSite=Lax`, `Path=/bff`, 운영에서 `Secure`         | `expiresIn` 초 (1시간) |
| `mp_refresh` | Refresh | `HttpOnly`, `SameSite=Lax`, `Path=/bff/session`, 운영에서 `Secure` | 14일                   |

- Refresh 쿠키는 `Path=/bff/session`으로 제한해서 일반 API 중계 요청에는 전송되지 않는다. 재발급·로그아웃 경로에서만 쓰인다.
- Access 쿠키가 만료되어 사라지면 중계 요청에는 `Authorization`이 붙지 않고 백엔드가 401을 돌려준다. 클라이언트는 이를 재발급 신호로 쓴다.

### 중계 (`app/bff/api/[...path]/route.ts`)

- 허용 경로는 `/bff/api/**`만이며 백엔드의 `{API_URL}/api/**`로만 전달한다(라우트의 `params.path`는 `/bff/api/` 뒤의 경로이므로 `api`를 다시 붙여 해석한다)(`..`, 인코딩된 경로 우회, 다른 호스트로의 전달을 막는다).
- 요청 메서드·쿼리·본문·`Content-Type`을 그대로 전달한다. 브라우저의 `Cookie`는 백엔드에 전달하지 않고, `mp_access`가 있으면 `Authorization: Bearer`로 바꿔 붙는다.
- 응답은 상태 코드와 본문을 그대로 돌려주고 `Set-Cookie` 등 hop-by-hop 헤더는 제외한다.
- CSRF 방어: `SameSite=Lax` 쿠키에 더해, GET·HEAD가 아닌 요청은 `Origin`이 현재 호스트와 같을 때만 처리한다. 다르면 403.
- 백엔드에 연결하지 못하면 502와 `{code: 'UPSTREAM_UNAVAILABLE'}`를 돌려준다.

### 세션 (`app/bff/session/*`)

- `POST /bff/session` `{accessToken, refreshToken, expiresIn}`: 두 쿠키를 설정한다. 값이 비었거나 형식이 맞지 않으면 400.
- `GET /bff/session`: `{authenticated: boolean}`. `mp_access`가 있으면 true. 없고 `mp_refresh`만 있으면 재발급을 시도해서 성공하면 true(새로고침 직후 복원), 거부되면 쿠키를 지우고 false, 백엔드에 닿지 못하면 쿠키를 유지한 채 502.
- `POST /bff/session/refresh`: `mp_refresh`로 백엔드 `/api/auth/refresh`를 호출하고 두 쿠키를 새 값으로 교체한다. Refresh가 없거나 `INVALID_REFRESH_TOKEN`, `EXPIRED_REFRESH_TOKEN`이면 쿠키를 지우고 401. 백엔드 연결 실패는 쿠키를 유지한 채 502.
- `DELETE /bff/session`: `mp_refresh`가 있으면 백엔드 `/api/auth/logout`을 호출(실패해도 무시)하고 두 쿠키를 지운다.

### 클라이언트 (`lib/api/client.ts`, `refresh.ts`)

- `createClient<paths>({ baseUrl: '/bff' })`. 스펙의 경로가 `/api/...`이므로 실제 요청은 `/bff/api/...`가 된다. 브라우저가 쿠키를 자동으로 보내므로 클라이언트는 토큰을 알지 못한다(`credentials: 'same-origin'`).
- 응답이 401이고 요청이 인증 엔드포인트가 아니면 `refresh()`를 기다린 뒤 원래 요청을 한 번만 다시 보낸다. 재시도가 다시 401이면 그대로 돌려준다. 재발급이 401이면 세션 상태를 `anonymous`로 바꾼다.
- `refresh()`는 진행 중인 Promise가 있으면 같은 Promise를 돌려준다(single-flight). 백엔드가 Refresh를 새로 발급(회전)하므로, 동시 만료에도 재발급은 1회만 호출되어야 한다. 서버 쪽 BFF가 동시에 여러 재발급을 받는 경우는 이 브라우저 측 합치기로 방지한다.
- 다른 4xx·5xx는 `unwrap()`이 `ApiError`로 변환해 호출부에 전달한다. 연결 실패는 `NetworkError`다.
- 쿼리 직렬화(`query.ts`): 백엔드는 조건 객체를 `condition`, 페이지를 `pageQuery`라는 하나의 파라미터로 문서화하지만 실제 요청은 `?keyword=삼성&page=0`처럼 평평하다. 객체 값은 한 단계 풀어서 보내고, 배열은 쉼표로 이어 붙인다(`ykihos=A,B`).

### 에러 (`errors.ts`)

- `ErrorResponse` zod 스키마: `{code: string, message: string, errors: {field: string, reason: string}[]}`.
- `ApiError`: `status`, `code`, `message`, `fieldErrors`를 가진다. 본문이 형식에 맞지 않으면 `code: 'UNKNOWN'`으로 변환한다. 네트워크 오류는 `NetworkError`로 구분한다.

### 인증 (`auth/`)

- `parseOAuthCallbackHash(hash)`: `{ ok: true, accessToken, refreshToken, expiresIn }` 또는 `{ ok: false, code }`를 돌려주는 순수 함수. 값이 빠졌거나 형식이 맞지 않으면 `ok: false`.
- `completeOAuthCallback(hash)`: fragment를 해석하고, 성공·실패와 관계없이 먼저 주소창의 fragment를 지운 뒤(`history.replaceState`) `POST /bff/session`으로 토큰을 한 번 넘긴다. 결과는 `{ok: true}` 또는 `{ok: false, code}`다.
- `signOut()`: `DELETE /bff/session`을 호출하고 쿼리 캐시를 비운다.
- `getSession()`: `GET /bff/session`. 앱 시작 시 로그인 여부를 판단하는 데 쓴다. 결과는 `authenticated` | `anonymous` | `unavailable`.
- `subscribeSessionExpired(listener)`: Refresh까지 거부되었을 때 알림을 받는다. 로그인 화면 이동이나 캐시 정리는 구독한 쪽이 한다.
- `loginUrl()`: `{API_URL}/oauth2/authorization/google`.

### 쿼리 규칙 (`features/*/queries.ts`)

- 키 팩토리: `regionKeys.all`, `regionKeys.sggu(sidoCode)`처럼 도메인 단위 계층 키.
- `queryOptions({ queryKey, queryFn })`를 export하고, `queryFn`은 `client`를 호출해 에러를 `ApiError`로 던지게 한다.
- 훅은 만들지 않는다. 화면에서 `useQuery(regionQueries.sido())`로 쓴다.
- 이번에는 `regions`와 `hospitals`(검색·상세)만 만든다. 나머지는 화면을 만들 때 같은 패턴으로 추가한다.

### 설정

- `NEXT_PUBLIC_API_URL`을 필수로 바꾸고 `.env.example`에 예시(`http://localhost:8080`)를 넣는다. 서버(BFF)의 중계·재발급, 로그인 시작 주소, 타입 생성에 모두 쓴다. `typecheck`와 `knip`은 `.env.example`을 읽어 실행하므로 로컬 `.env` 없이도 통과한다.
- `package.json` 스크립트: `api:generate`는 `scripts/generate-api.mjs`가 `{API_URL}/api-docs`에서 `src/lib/api/schema.d.ts`를 만든다(운영체제와 무관하게 동작). 로컬 백엔드 또는 dev 서버를 대상으로 실행한다.
- 의존성 추가: `openapi-fetch`, `openapi-typescript`(dev), `vitest`(dev). `msw`, `zod`, `@tanstack/react-query`는 이미 설치돼 있다. `zustand`는 이번에 쓰지 않으므로 knip 예외를 유지하고, `msw`는 테스트에서 쓰므로 예외에서 제거했다.
- `msw` 3은 미처리 요청 옵션 이름이 `onUnhandledFrame`이다. 테스트는 처리하지 않은 요청을 오류로 만든다.

## 테스트 (vitest + msw)

BFF 라우트는 `Request` 객체를 직접 넘겨 핸들러를 호출하고, 백엔드는 msw로 대신한다.

- 중계: `mp_access`가 있으면 `Authorization: Bearer`로 바뀌어 전달된다. 브라우저 `Cookie`는 백엔드로 가지 않는다. 없으면 `Authorization` 없이 전달된다.
- 중계: `/api/` 밖의 경로, `..`, 다른 호스트로의 우회는 거부한다. 다른 출처의 `Origin`을 가진 POST는 403.
- 중계: 백엔드 응답의 상태·본문이 그대로 전달되고, 연결 실패는 502.
- 세션: `POST`가 두 쿠키를 올바른 속성으로 설정한다(`HttpOnly`, `SameSite=Lax`, `Path`, 개발에서는 `Secure` 없음). 잘못된 본문은 400.
- 세션: `refresh`가 두 쿠키를 새 값으로 교체한다. Refresh가 만료·무효면 쿠키를 지우고 401, 백엔드 연결 실패면 쿠키를 유지하고 502.
- 세션: `GET`이 `mp_access`만 있을 때, 없고 `mp_refresh`만 있을 때(재발급 성공·실패), 둘 다 없을 때를 처리한다. `DELETE`가 로그아웃 호출 실패에도 쿠키를 지운다.
- 클라이언트: 401이면 재발급 후 같은 요청을 한 번 재시도한다. 동시에 만료된 요청 N개에서 재발급은 1회만 호출된다. 재시도가 다시 401이면 반복하지 않는다. 재발급이 401이면 `anonymous`가 된다.
- 에러: 본문이 `ApiError`로 변환된다(필드 에러 포함, 형식이 맞지 않는 본문은 `UNKNOWN`, 네트워크 오류는 `NetworkError`).
- `parseOAuthCallbackHash`가 성공, 값 누락, `#error=…`, 잘못된 `expiresIn`을 처리한다.
- 검증: `pnpm check`(lint, typecheck, format, knip)와 `pnpm test`가 통과한다.

## 범위 밖

- 화면, 라우트 UI, OAuth 콜백 페이지(위 함수를 호출하는 얇은 페이지는 화면 작업에서 추가)
- 서버 컴포넌트에서의 prefetch와 인증 호출(`apiClient`는 브라우저 전용). 쿠키가 같은 출처에 있으므로 `cookies()`로 같은 토큰을 읽어 prefetch할 수 있는 구조지만 이번에는 구현하지 않는다.
- 백엔드가 직접 httpOnly 쿠키를 내려주는 방식
- 후기·마이페이지·관리자 쿼리(화면 작업에서 같은 패턴으로 추가)

## 위험과 후속

- 로그인 직후 토큰이 fragment로 오기 때문에 콜백 페이지의 JS가 한 번 읽는다. 이 순간에 악성 스크립트가 있으면 노출될 수 있다. 백엔드가 쿠키를 직접 내려주도록 바꾸면 완전히 막을 수 있으며, 프론트와 백엔드의 도메인 구성(같은 사이트인지)이 확정되면 검토한다.
- BFF가 모든 API 요청을 중계하므로 응답 지연이 한 번 더 늘고, 서버 비용이 생긴다. 배포(Vercel)의 함수 제한(본문 크기, 실행 시간)을 확인해야 한다.
- 백엔드 스펙이 바뀌면 `pnpm api:generate`를 다시 실행하고 타입 오류를 해결해야 한다. CI에서 스펙 동기화를 검증할지는 별도로 결정한다.
- 배포 환경별로 `Secure` 쿠키와 `API_URL`, `OAUTH2_REDIRECT_URI`(콜백 주소)가 일치해야 한다.
