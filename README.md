# MediPrice Frontend

의료비(비급여) 가격 비교 서비스의 웹 프론트엔드. Next.js 16 · React 19 · TanStack Query.

## 시작하기

```bash
pnpm install
cp .env.example .env     # NEXT_PUBLIC_API_URL을 백엔드 주소로 수정
pnpm dev
```

| 환경변수                          | 필수                                                     | 설명                                                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`             | 항상                                                     | 백엔드 주소(예: `http://localhost:8080`). BFF 중계, 로그인 시작, 타입 생성에 쓴다                                                                                       |
| `NEXT_PUBLIC_SITE_URL`            | 운영 빌드(`NODE_ENV=production`, 로컬 `pnpm build` 포함) | 이 사이트의 공개 주소(origin). canonical·Open Graph·sitemap·robots에 쓴다. Vercel 미리보기는 비워 두면 브랜치 주소(`VERCEL_BRANCH_URL`), 개발은 `http://localhost:3000` |
| `BFF_SHARED_SECRET`               | 운영 배포(`VERCEL_ENV=production`)                       | 백엔드와 같은 공유 비밀값(16자 이상). BFF가 사용자 IP를 백엔드에 전달한다(AI 비회원 한도)                                                                               |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 선택                                                     | 네이버 지도 Client ID. 없으면 지도 탐색(`/map`)이 목록만 보여 준다                                                                                                      |

환경변수는 `src/env.ts`가 zod로 검증한다. 실제 비밀값은 `.env`(git 제외)와 Vercel 환경변수에만 둔다.

| 명령                 | 설명                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`         | lint, typecheck, format, knip, test를 모두 실행(PR 전에 실행)                                                                                   |
| `pnpm test`          | 단위 테스트(vitest + msw)                                                                                                                       |
| `pnpm format`        | 포맷 자동 수정                                                                                                                                  |
| `pnpm api:generate`  | 백엔드 `/api-docs`에서 타입을 다시 생성                                                                                                         |
| `pnpm launch:check`  | 출시 전 법적 고지 설정(`src/config/legal-facts.json`)에 빈 값이 없는지 확인([`docs/legal-launch-checklist.md`](docs/legal-launch-checklist.md)) |
| `pnpm ui:add <이름>` | shadcn 컴포넌트를 `src/components/primitives`에 추가(지금은 쓰는 생성물이 없다)                                                                 |

## 백엔드 연동 구조

설계 문서: [`docs/superpowers/specs/2026-11-12-api-integration-design.md`](docs/superpowers/specs/2026-11-12-api-integration-design.md)

```
브라우저 ──▶ Next /bff/api/**  ──(쿠키의 Access를 Authorization으로 바꿔 중계)──▶ 백엔드 /api/**
              /bff/session/**   로그인 쿠키 설정·재발급·로그아웃
```

- 로그인 토큰은 **httpOnly 쿠키**에만 있다. 브라우저의 JavaScript는 토큰을 읽을 수 없고, 컴포넌트와 쿼리에서 토큰을 다룰 일이 없다.
- 브라우저는 같은 출처의 `/bff/**`만 호출한다(백엔드 CORS 설정 불필요).
- Access가 만료되면(401) API 클라이언트가 `/bff/session/refresh`를 한 번만 호출하고 원래 요청을 다시 보낸다. Refresh까지 거부되면 `subscribeSessionExpired`로 알린다.
- 재발급은 `POST /bff/session/refresh` 한 곳에서만 한다. 브라우저의 모든 클라이언트와 `getSession`이 refresher 하나(`sharedRefresher`)를 함께 쓰고, `GET /bff/session`은 재발급하지 않고 `refreshable`만 알린다. BFF는 같은 Refresh로 동시에 온 재발급을 인스턴스 안에서 합치고, 회전 직후 3초 동안 이전 Refresh로 늦게 온 요청에는 새 토큰 없이 쿠키를 건드리지 않는 200을 돌려준다(늦게 온 요청이 새 쿠키를 지우지 않게). 로그아웃은 진행 중인 재발급이 끝난 뒤 보내고, 그동안 새 재발급은 요청 없이 실패시킨다. 브라우저 재발급 요청은 40초가 지나면 끊는다.
- `GET /bff/session`은 Access가 있으면 서버에서 `/api/users/me`까지 읽어 `{ authenticated: true, user }`로 답한다. 로그인 확인이 왕복 한 번으로 끝난다. 내 정보를 읽지 못하면(401·장애) `user` 없이 답하고, 브라우저가 `/bff/api/users/me`로 따로 읽는다(401이면 거기서 재발급).

```
src/
  app/bff/            BFF 라우트(api 중계, session, session/refresh). 핸들러는 얇게
  app/oauth/callback/ 로그인 콜백 화면(토큰을 BFF 쿠키로 바꾼다)
  server/bff/         서버 전용: 쿠키, 업스트림 호출, 재발급, 응답 헬퍼
  server/api/         서버 컴포넌트의 익명 공개 조회(publicApi), 요청마다 QueryClient, 404 판정
  lib/api/            타입(schema.d.ts, 생성물), 클라이언트, 에러, 에러 코드 → 문구 키, 쿼리 직렬화, 세션 만료 이벤트
  features/<도메인>/  쿼리 옵션(queryOptions)과 쿼리 키, 생성 타입에 아직 없는 호출(api.ts). auth는 로그인 창·콜백·세션 훅(`useSession`)
```

### 호출하는 법

화면에서는 쿼리 옵션만 쓴다.

```tsx
const { data: districts } = useQuery(regionQueries.sggu('110000'));
const { data: hospital } = useQuery(hospitalQueries.detail(ykiho));
```

- 응답 타입은 백엔드 스펙에서 생성된다. null이 될 수 있는 필드는 `string | null`이다.
- 실패는 예외로 던져진다. `ApiError`(`status`, `code`, `fieldErrors`) 또는 `NetworkError`다. `code`로 분기하고, 입력 검증 실패(`INVALID_INPUT`)는 `fieldErrors`로 폼에 연결한다.
- 조건 객체(`condition`)와 페이지(`pageQuery`)는 스펙 모양대로 넘기면 `?keyword=…&page=0`처럼 평평하게 직렬화된다.

### 로그인

1. 로그인이 필요한 동작은 `useLoginGuard()`로 감싸거나 `openLoginDialog({ reason })`를 부른다. 로그인 창(`LoginDialog`)은 `(shell)/layout.tsx`의 `<AuthDialogs/>`가 한 번만 렌더한다.
2. "Google로 계속하기"는 `startGoogleLogin(returnTo)`로 백엔드 로그인 주소(`loginUrl`)로 이동한다. 이때 `redirect_uri`(이 앱의 `/oauth/callback`)와 `return_to`(돌아올 경로)를 붙이고, 같은 경로를 sessionStorage에도 저장해 둔다.
3. 백엔드가 `/oauth/callback#accessToken=…[&returnTo=…]`로 돌려보내면 콜백 페이지가 토큰을 BFF 쿠키로 바꾸고 주소창에서 지운 뒤 `returnTo` → sessionStorage → `/` 순서로 돌아간다.
4. 화면에서는 `useSession()`(`pending | authenticated | anonymous | error`)으로 로그인 상태를 읽는다. 로그인이 필요한 영역은 `<LoginRequired reason="…">`로 감싼다. 로그아웃은 `signOut()`.

> `redirect_uri`·`return_to`는 백엔드 `fix/frontend-integration` 브랜치에서 지원한다. 배포되기 전의 백엔드는 두 값을 무시하고 자기 기본 주소로 돌려보낸다.

## 코딩 컨벤션

폴더 구조, 의존 방향, 이름, 주석 규칙은 [`docs/coding-convention.md`](docs/coding-convention.md)에 있다. 의존 방향과 `server` 경계는 ESLint와 `server-only`가 강제한다.

화면을 만들 때 알아둘 것:

- **컴포넌트**: `components/ui`(Figma와 1:1인 디자인 시스템), `components/layout`(TopNav·탭바 같은 틀), `features/<도메인>/components`(도메인 UI). `ui`는 `radix-ui`를 직접 감싼다. shadcn 생성물을 들이면 `components/primitives`에 두고 `ui`에서만 감싼다(6장).
- **색·글자**: Figma 토큰 이름 그대로 쓴다(`bg-primary`, `text-text-secondary`, `text-title`, `shadow-card`). 토큰은 `src/app/globals.css`에 있고 Tailwind 기본 팔레트는 지워져 있다(8장).
- **문구**: 화면에 보이는 글은 `src/i18n/messages/ko/<네임스페이스>.json`에 두고 `useTranslations`로 쓴다. 날짜는 `useFormatter`로 포맷한다(서울 시간 고정). 에러 문구는 `errorMessageKey(error)`로 고른다(12장).
- **모바일**: 기본 클래스가 모바일(360px), `lg:`부터 데스크톱(1440px)이다(13장).

## 새 도메인(쿼리) 추가하기

1. 백엔드가 바뀌었으면 `pnpm api:generate`로 타입을 갱신한다(생성 파일은 커밋한다).
2. `src/features/<도메인>/queries.ts`를 만든다.
   - 키 팩토리: `all` → `lists()` / `list(params)` / `details()` / `detail(id)`처럼 도메인에서 항목으로 좁혀지는 계층. 한 번에 무효화할 수 있다.
   - `queryOptions({ queryKey, queryFn })`를 export한다. `queryFn`은 `unwrap(apiClient.GET(…))`다(에러를 `ApiError`로 던짐).
   - 훅은 만들지 않는다. 화면에서 `useQuery(옵션)`으로 쓴다.
3. `queries.test.ts`를 만든다. `src/features/regions/queries.test.ts`를 따라 `apiClient`를 절대 주소로 바꾸고 msw로 백엔드를 대신한다.
4. 상태를 바꾸는 요청(POST/PUT/PATCH/DELETE)은 같은 출처에서 보낸 것만 BFF가 받는다. `useMutation`의 `mutationFn`에서 `unwrap(apiClient.POST(…))`를 쓰고, 성공하면 관련 키를 무효화한다.

## 알아둘 점

- `apiClient`는 상대 주소(`/bff`)를 쓰는 **브라우저 전용**이다. 검색에 노출할 화면(항목·병원 상세)은 같은 쿼리 옵션에 `publicApi`(`src/server/api/public-client.ts`, 쿠키 없는 익명 호출)를 넘겨 서버 컴포넌트에서 채우고 `HydrationBoundary`로 넘긴다. 로그인 사용자의 데이터를 서버에서 미리 읽는 경로는 없다(코딩 컨벤션 7.2).
- `NEXT_PUBLIC_API_URL`·`NEXT_PUBLIC_SITE_URL`은 빌드에도 필요하다. 배포(Vercel)의 Production에는 둘 다, Preview에는 `NEXT_PUBLIC_API_URL`을 설정한다(Preview의 `NEXT_PUBLIC_SITE_URL`은 비우면 브랜치 주소). 로컬에서 `pnpm build`를 하려면 `.env`에 `NEXT_PUBLIC_SITE_URL`을 넣는다.
- 로그인이 끝나면 백엔드가 돌려보낼 기본 주소(`OAUTH2_REDIRECT_URI`)는 이 앱의 `/oauth/callback`이어야 한다. 다른 주소(로컬, 프리뷰)에서 로그인하려면 그 origin을 백엔드 `OAUTH2_ALLOWED_REDIRECT_ORIGINS`와 `CORS_ALLOWED_ORIGINS`에 넣는다.
