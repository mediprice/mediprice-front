# MediPrice Frontend

의료비(비급여) 가격 비교 서비스의 웹 프론트엔드. Next.js 16 · React 19 · TanStack Query.

## 시작하기

```bash
pnpm install
cp .env.example .env     # NEXT_PUBLIC_API_URL을 백엔드 주소로 수정
pnpm dev
```

| 환경변수              | 설명                                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | 백엔드 주소(예: `http://localhost:8080`). BFF 중계, 로그인 시작, 타입 생성에 쓴다 |

| 명령                | 설명                                                          |
| ------------------- | ------------------------------------------------------------- |
| `pnpm check`        | lint, typecheck, format, knip, test를 모두 실행(PR 전에 실행) |
| `pnpm test`         | 단위 테스트(vitest + msw)                                     |
| `pnpm api:generate` | 백엔드 `/api-docs`에서 타입을 다시 생성                       |

## 백엔드 연동 구조

설계 문서: [`docs/superpowers/specs/2026-11-12-api-integration-design.md`](docs/superpowers/specs/2026-11-12-api-integration-design.md)

```
브라우저 ──▶ Next /bff/api/**  ──(쿠키의 Access를 Authorization으로 바꿔 중계)──▶ 백엔드 /api/**
              /bff/session/**   로그인 쿠키 설정·재발급·로그아웃
```

- 로그인 토큰은 **httpOnly 쿠키**에만 있다. 브라우저의 JavaScript는 토큰을 읽을 수 없고, 컴포넌트와 쿼리에서 토큰을 다룰 일이 없다.
- 브라우저는 같은 출처의 `/bff/**`만 호출한다(백엔드 CORS 설정 불필요).
- Access가 만료되면(401) API 클라이언트가 `/bff/session/refresh`를 한 번만 호출하고 원래 요청을 다시 보낸다. Refresh까지 거부되면 `subscribeSessionExpired`로 알린다.

```
src/
  app/bff/            BFF 라우트(api 중계, session, session/refresh). 핸들러는 얇게
  server/bff/         서버 전용: 쿠키, 업스트림 호출, 재발급, 응답 헬퍼
  lib/api/            타입(schema.d.ts, 생성물), 클라이언트, 에러, 쿼리 직렬화, 세션 만료 이벤트
  features/<도메인>/  쿼리 옵션(queryOptions)과 쿼리 키. auth는 로그인 시작·콜백·세션 헬퍼
```

### 호출하는 법

화면에서는 쿼리 옵션만 쓴다.

```tsx
const { data } = useQuery(regionQueries.sido());
const { data: hospitals } = useQuery(
  hospitalQueries.search({
    condition: { keyword: '삼성' },
    pageQuery: { size: 20 },
  }),
);
```

- 응답 타입은 백엔드 스펙에서 생성된다. null이 될 수 있는 필드는 `string | null`이다.
- 실패는 예외로 던져진다. `ApiError`(`status`, `code`, `fieldErrors`) 또는 `NetworkError`다. `code`로 분기하고, 입력 검증 실패(`INVALID_INPUT`)는 `fieldErrors`로 폼에 연결한다.
- 조건 객체(`condition`)와 페이지(`pageQuery`)는 스펙 모양대로 넘기면 `?keyword=…&page=0`처럼 평평하게 직렬화된다.

### 로그인

1. 로그인 버튼은 `loginUrl()`로 이동시킨다(백엔드가 구글 로그인을 진행).
2. 백엔드가 `/oauth/callback#accessToken=…`로 돌려보내면, 콜백 페이지에서 `completeOAuthCallback(window.location.hash)`를 호출한다. 토큰을 쿠키로 바꾸고 주소창에서 지운다.
3. 앱 시작 시 `getSession()`으로 로그인 여부를 확인하고, 로그아웃은 `signOut()`을 쓴다.

> 콜백 페이지와 로그인 버튼 UI는 아직 없다. 위 함수를 호출하는 얇은 페이지를 화면 작업에서 추가한다.

## 코딩 컨벤션

폴더 구조, 의존 방향, 이름, 주석 규칙은 [`docs/coding-convention.md`](docs/coding-convention.md)에 있다. 의존 방향과 `server` 경계는 ESLint와 `server-only`가 강제한다.

## 새 도메인(쿼리) 추가하기

1. 백엔드가 바뀌었으면 `pnpm api:generate`로 타입을 갱신한다(생성 파일은 커밋한다).
2. `src/features/<도메인>/queries.ts`를 만든다.
   - 키 팩토리: `all` → `lists()` / `list(params)` / `details()` / `detail(id)`처럼 도메인에서 항목으로 좁혀지는 계층. 한 번에 무효화할 수 있다.
   - `queryOptions({ queryKey, queryFn })`를 export한다. `queryFn`은 `unwrap(apiClient.GET(…))`다(에러를 `ApiError`로 던짐).
   - 훅은 만들지 않는다. 화면에서 `useQuery(옵션)`으로 쓴다.
3. `queries.test.ts`를 만든다. `src/features/regions/queries.test.ts`를 따라 `apiClient`를 절대 주소로 바꾸고 msw로 백엔드를 대신한다.
4. 상태를 바꾸는 요청(POST/PUT/PATCH/DELETE)은 같은 출처에서 보낸 것만 BFF가 받는다. `useMutation`의 `mutationFn`에서 `unwrap(apiClient.POST(…))`를 쓰고, 성공하면 관련 키를 무효화한다.

## 알아둘 점

- `apiClient`와 이를 쓰는 쿼리 옵션은 상대 주소(`/bff`)를 쓰는 **브라우저 전용**이다. 서버 컴포넌트에서 prefetch하려면 쿠키를 읽어 백엔드로 직접 보내는 서버용 호출 경로를 따로 만들어야 한다(아직 없음).
- `NEXT_PUBLIC_API_URL`은 빌드에도 필요하다. 배포(Vercel)에 설정해야 한다.
- 로그인이 끝나면 백엔드가 돌려보낼 주소(`OAUTH2_REDIRECT_URI`)는 이 앱의 `/oauth/callback`과 같아야 한다.
