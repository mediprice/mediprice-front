# Coding Conventions

mediprice-frontend의 코딩 규칙입니다. 사람과 AI(Claude Code 등)가 일관된 코드를 쓰는 것이 목표입니다.
더 좋은 아이디어가 있거나 잘못된 내용이 있으면 누구나 언제든지 수정할 수 있습니다.

규칙 표기: **MUST**는 반드시 지킨다, **SHOULD**는 기본으로 지키되 합당한 이유가 있으면 예외를 허용한다. 표기가 없으면 SHOULD로 본다.

## 도구로 강제되는 규칙

| 도구                           | 설정                               | 검사 대상                                                                                                 |
| ------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Prettier                       | `prettier.config.mjs`              | 포맷(작은따옴표, 후행 쉼표, Tailwind 클래스 정렬)                                                         |
| ESLint                         | `eslint.config.mjs`                | import 정렬, 미사용 import, `type` import, `no-floating-promises`, TanStack Query 규칙, Next 규칙         |
| ESLint `no-restricted-imports` | `eslint.config.mjs`                | 2.2 의존 방향 (`lib`·`components`는 `features`·`app`·`server`를, 클라이언트는 `server`를 import하지 않음) |
| ESLint `no-console`            | `eslint.config.mjs`                | `console.log` 금지 (`warn`·`error`는 허용)                                                                |
| TypeScript `strict`            | `tsconfig.json`                    | `noUncheckedIndexedAccess`, `noImplicitOverride` 포함                                                     |
| `server-only`                  | `src/server/**`                    | 서버 전용 코드가 클라이언트 번들에 들어가면 빌드 실패                                                     |
| knip                           | `knip.jsonc`                       | 쓰지 않는 파일·export·의존성                                                                              |
| commitlint + husky             | `commitlint.config.mjs`, `.husky/` | 11장 커밋 메시지, 커밋 전 lint·format                                                                     |

```bash
pnpm format         # 포맷 자동 수정
pnpm check          # lint + typecheck + format:check + knip + test (CI와 같은 검사)
```

도구가 없는 규칙(위치 선택, 파일 크기, 주석 품질, 컴포넌트 경계 등)은 코드 리뷰에서 확인한다.

## 목차

- 1. 이름
- 2. 폴더 구조와 의존 방향
- 3. 파일과 export
- 4. import
- 5. TypeScript
- 6. React / Next
- 7. 데이터 요청
- 8. 스타일
- 9. 주석과 문서
- 10. 테스트
- 11. Git

## 1. 이름

### 1.1 식별자에는 영문/숫자만 허용 (MUST)

변수, 함수, 타입, 파일 이름에는 영어와 숫자만 쓴다. 한국어 발음을 영어로 옮기지 않는다(`juso` 대신 `address`). 사용자에게 보이는 문구는 예외다.

### 1.2 파일 이름은 kebab-case

```text
hospital-card.tsx     use-debounce.ts     query-client.ts
```

Next의 특수 파일(`page.tsx`, `layout.tsx`, `route.ts`)과 폴더 이름도 같은 규칙을 따른다. 컴포넌트 파일에 컴포넌트가 하나면 파일 이름이 컴포넌트 이름의 kebab-case다(`HospitalCard` → `hospital-card.tsx`).

### 1.3 이름 형태

| 대상                       | 형태                                | 예                                         |
| -------------------------- | ----------------------------------- | ------------------------------------------ |
| 컴포넌트, 타입, 클래스     | PascalCase (타입에 `I` 접두사 금지) | `HospitalCard`, `ApiError`, `SearchParams` |
| 함수, 변수, 훅             | camelCase (훅은 `use` 시작)         | `parseOAuthCallbackHash`, `useDebounce`    |
| 진짜 상수(불변인 설정값)   | UPPER_SNAKE_CASE                    | `BFF_BASE`, `REFRESH_MAX_AGE_SECONDS`      |
| zod 스키마                 | `xxxSchema`                         | `signInSchema`                             |
| 쿼리 키 / 쿼리 옵션 팩토리 | `xxxKeys` / `xxxQueries`            | `hospitalKeys`, `hospitalQueries`          |
| boolean                    | `is`·`has`·`should`·`can`으로 시작  | `isLoading`, `hasNext`                     |
| 이벤트 핸들러 / 콜백 prop  | `handleX` / `onX`                   | `handleSubmit`, `onSelect`                 |

### 1.4 이름은 역할을 드러낸다

- 함수 이름은 동사로 시작한다(`parseX`, `buildX`, `resolveX`). 무엇을 돌려주는지가 아니라 무엇을 하는지를 쓴다.
- `data`, `info`, `handle`, `util`, `common`, `manager`처럼 아무 데나 붙는 이름은 쓰지 않는다.
- 한 글자 이름은 짧은 콜백의 인자(`(h) => h.name`)나 반복 변수에만 쓴다.
- 서로 다른 계층에 같은 이름의 파일(`session.ts`)을 두지 않는다. 역할이 드러나게 짓는다(`refresh-session.ts`).

## 2. 폴더 구조와 의존 방향

### 2.1 구조

```text
src/
  env.ts                  검증된 환경변수
  app/                    라우팅 전용. 페이지는 features의 컴포넌트를 조립만 한다
    bff/                  BFF 라우트(핸들러는 얇게, 로직은 server/bff)
    <route>/_components/  그 라우트에서만 쓰는 조각 (Next의 private 폴더)
  features/<도메인>/      도메인 하나의 모든 것
    queries.ts            쿼리 키 + queryOptions (+ 뮤테이션 옵션)
    schemas.ts            폼·입력 zod 스키마 (필요할 때)
    components/           그 도메인의 UI (필요할 때)
  components/
    ui/                   shadcn 프리미티브 (생성물, 수정 금지)
    layout/               여러 라우트가 공유하는 헤더·푸터 같은 틀 (필요할 때)
  lib/                    도메인을 모르는 공용 코드
    api/                  HTTP 클라이언트, 에러, 쿼리 직렬화, 재발급, 세션 만료 이벤트, schema.d.ts
  server/bff/             서버 전용 코드: 쿠키, 업스트림 호출, 재발급, 응답 헬퍼
  test/                   테스트 공용 설정 (msw 서버, 요청 헬퍼)
```

`features/<도메인>`은 지금 `auth`, `hospitals`, `regions`가 있고, 화면을 만들 때 `npay`, `comparison`, `review`, `mypage`, `admin`이 같은 모양으로 생긴다. 필요할 때만 만들고 빈 폴더를 미리 만들지 않는다.

### 2.2 의존 방향 (MUST)

```text
app ──▶ features ──▶ components, lib
 │                      ▲
 └──▶ server ───────────┘      (server는 서버에서만 실행된다)
```

- `lib`, `components`는 `features`, `app`, `server`를 import하지 않는다. 도메인을 알면 `features`에 둔다.
- 클라이언트 코드(`features`, `components`, `lib`, `app`의 화면)는 `server`를 import하지 않는다. 예외는 `app/bff/**` 라우트와 테스트다.
- `server/**`의 파일은 첫 줄에 `import 'server-only';`를 둔다.
- 다른 feature의 코드는 `queries.ts`와 `components/`만 import한다. 내부 파일을 직접 가져오지 않는다.
- 폴더를 넘나드는 import는 `@/` 절대 경로를 쓰고 `../..`는 쓰지 않는다.

**나쁜 예**

```ts
// src/lib/format.ts
import { hospitalKeys } from '@/features/hospitals/queries'; // lib이 도메인을 안다
```

**좋은 예**

```ts
// src/features/hospitals/components/price-tag.tsx
import { formatWon } from '@/lib/format'; // features가 lib을 쓴다
```

### 2.3 코드를 어디에 둘까

위에서부터 차례로 물어보고, 처음 "예"가 나온 곳에 둔다.

1. 한 라우트에서만 쓰는가 → `app/<route>/_components/`
2. 도메인을 전혀 모르는 범용 UI(버튼, 다이얼로그)인가 → `components/ui/`
3. 여러 라우트가 공유하는 화면의 틀(헤더, 푸터)인가 → `components/layout/`
4. 병원, 후기, 로그인 같은 도메인을 아는 코드인가 → `features/<도메인>/`
5. 도메인을 모르는 로직(포맷, HTTP, 유틸)인가 → `lib/`
6. 서버에서만 실행되는가(쿠키, 백엔드 호출) → `server/`

`hooks/`, `utils/`, `types/`, `common/` 같은 전역 폴더는 만들지 않는다. 무엇이든 들어가서 위치가 겹치는 원인이 된다.

### 2.4 쪼개는 기준

- 파일은 개념 하나만 담는다. 약 150줄을 넘거나 바뀌는 이유가 둘 이상이면 나눈다.
- 폴더는 같은 주제의 파일이 3개 이상 생길 때 만든다. 처음에는 평평하게 시작한다.
- 한 곳에서만 쓰는 코드는 쓰는 곳 옆에 둔다. 두 번째 사용처가 생기면 옮긴다.

## 3. 파일과 export

### 3.1 명명 export가 기본 (MUST)

`export default`는 Next가 요구하는 특수 파일(`page`, `layout`, `loading`, `error`, `not-found` 등)에서만 쓴다. 그 외에는 명명 export를 쓴다. 이름 변경과 자동 완성, 검색이 쉬워진다.

### 3.2 배럴 파일(`index.ts`) 금지

폴더의 `index.ts`로 다시 내보내지 않는다. 번들 크기와 순환 import, 개발 서버 속도에 불리하다. 항상 파일을 직접 import한다.

### 3.3 한 파일에 컴포넌트 하나

작은 보조 컴포넌트는 같은 파일에 둘 수 있지만, 다른 파일에서 쓰는 순간 자기 파일로 옮긴다.

## 4. import

### 4.1 경로

- 다른 폴더: `@/` 절대 경로 (`import { cn } from '@/lib/utils'`)
- 같은 폴더: `./` 상대 경로 (`import { toApiError } from './errors'`)
- `../`는 쓰지 않는다.

### 4.2 정렬과 type import

정렬은 ESLint(`simple-import-sort`)가 자동으로 맞춘다. 타입만 가져올 때는 `type`을 붙인다(`import { type Foo } from …` 또는 `import type`).

## 5. TypeScript

### 5.1 `any` 금지 (MUST)

모르는 값은 `unknown`으로 받고 좁힌다.

### 5.2 `as` 단언은 사유가 있을 때만

타입 시스템이 알 수 없는 사실을 코드가 알 때만 쓰고, 이유를 한 줄 TSDoc으로 남긴다. 값을 믿고 싶어서 쓰지 않는다.

**나쁜 예**

```ts
const body = (await response.json()) as { authenticated?: boolean };
```

**좋은 예**

```ts
const body = sessionSchema.parse(await response.json());
```

### 5.3 외부 입력은 zod로 검증 (MUST)

서버 응답, 쿠키, URL 파라미터, 폼 값처럼 코드 밖에서 들어오는 값은 zod로 검증한 뒤 쓴다. 백엔드 API 응답은 생성된 타입(`schema.d.ts`)을 믿고, 스펙에 없는 에러 본문 같은 것만 zod로 검증한다.

### 5.4 타입 선언

- 객체 모양은 `type`을 기본으로 쓴다. `interface`는 선언 병합이 필요할 때만 쓴다.
- `enum` 대신 문자열 유니언을 쓴다(`type Role = 'USER' | 'ADMIN'`).
- 함수의 반환 타입은 추론에 맡긴다. 공개 API처럼 계약이 중요한 곳만 명시한다.

## 6. React / Next

### 6.1 서버 컴포넌트가 기본

`'use client'`는 상태, 효과, 브라우저 API가 필요한 가장 작은 조각에만 붙인다. 페이지 전체를 클라이언트 컴포넌트로 만들지 않는다.

### 6.2 데이터를 `useEffect`로 가져오지 않는다 (MUST)

서버 데이터는 TanStack Query로 가져온다(7장). 효과는 구독, 타이머, 브라우저 API 연동에만 쓴다.

### 6.3 상태는 있어야 할 곳에 둔다

| 종류                       | 위치                                     |
| -------------------------- | ---------------------------------------- |
| 서버 데이터                | TanStack Query (다른 곳에 복사하지 않음) |
| 폼 입력                    | react-hook-form + zod 스키마             |
| 화면에서만 쓰는 값         | `useState`                               |
| 여러 화면이 공유하는 UI 값 | zustand (서버 데이터는 넣지 않음)        |
| 공유할 수 있는 상태(필터)  | URL 쿼리 파라미터                        |

### 6.4 라우트와 페이지는 얇게

- `page.tsx`, `route.ts`는 조립과 위임만 한다. 로직은 `features`나 `server`에 둔다.
- 라우트 핸들러(`route.ts`)는 요청을 검증하고, `server`의 함수를 부르고, 응답을 만드는 일만 한다.

## 7. 데이터 요청

### 7.1 호출 경로

```text
컴포넌트 ──▶ features/<도메인>/queries.ts ──▶ lib/api의 apiClient ──▶ /bff/** ──▶ 백엔드
```

- 브라우저는 같은 출처의 `/bff/**`만 호출한다. 백엔드 주소를 직접 부르지 않는다. 토큰은 httpOnly 쿠키에 있어 코드에서 다루지 않는다.
- `apiClient`는 `features/*/queries.ts`에서만 호출한다. 컴포넌트가 직접 부르지 않는다.
- 호출은 항상 `unwrap(apiClient.GET(...))`로 감싼다. 실패는 예외(`ApiError`, `NetworkError`)로 던져진다.

### 7.2 쿼리 키와 옵션

도메인에서 항목으로 좁혀지는 계층 키를 쓰고, `queryOptions`를 export한다. 훅은 만들지 않는다.

```ts
export const hospitalKeys = {
  all: ['hospitals'] as const,
  detail: (ykiho: string) => [...hospitalKeys.all, 'detail', ykiho] as const,
};

export const hospitalQueries = {
  detail: (ykiho: string) =>
    queryOptions({
      queryKey: hospitalKeys.detail(ykiho),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/hospitals/{ykiho}', {
            params: { path: { ykiho } },
          }),
        ),
    }),
};
```

화면에서는 `useQuery(hospitalQueries.detail(id))`로 쓴다. `apiClient`는 브라우저 전용이라 서버 컴포넌트에서 이 옵션으로 prefetch할 수 없다. 서버에서 prefetch가 필요해지면 서버용 호출 경로를 따로 만든다.

### 7.3 변경과 캐시

- 상태를 바꾸는 요청은 `useMutation`을 쓰고, 성공하면 관련 키를 무효화한다.
- 로그인과 로그아웃 때는 쿼리 캐시를 비운다. 이전 사용자의 데이터가 남으면 안 된다.

### 7.4 에러

- 에러는 `ApiError.code`로 분기한다. 메시지 문자열을 비교하지 않는다.
- 입력 검증 실패(`INVALID_INPUT`)는 `fieldErrors`를 폼의 해당 칸에 연결한다.
- 에러를 삼키지 않는다. 처리할 수 없으면 위로 던진다.

## 8. 스타일

- 스타일은 Tailwind 클래스로 쓰고, 조건부 클래스는 `cn()`으로 합친다.
- 변형(크기, 색상)이 있는 컴포넌트는 `cva`로 선언한다.
- `components/ui/`의 shadcn 생성물은 직접 고치지 않는다. 바꾸고 싶으면 감싸는 컴포넌트를 만든다.
- 인라인 `style`은 쓰지 않는다. 색과 간격은 `globals.css`의 디자인 토큰을 쓴다.

## 9. 주석과 문서

### 9.1 주석은 정말 중요한 것만

이름과 타입으로 알 수 있는 것은 쓰지 않는다. 코드만 봐서는 이유를 알 수 없는 제약이나 우회(예: 백엔드가 Refresh를 회전시켜 재발급을 하나로 합쳐야 함)만 남긴다.

### 9.2 남길 때는 한 줄 TSDoc

```ts
/** 백엔드가 재발급마다 Refresh를 회전시키므로 동시 호출을 하나로 합친다. */
export function createRefresher(baseUrl: string) {}
```

- `//` 여러 줄 설명과 장황한 블록 주석을 쓰지 않는다. 긴 설명은 README나 `docs/`에 쓴다.
- 주석 처리한 코드를 남기지 않는다. 필요하면 git 이력에서 찾는다.
- `TODO`는 이슈 번호가 있을 때만 남긴다.

## 10. 테스트

- 테스트는 소스 옆에 둔다(`regions/queries.ts`와 `regions/queries.test.ts`). 공용 설정과 헬퍼만 `src/test/`에 둔다.
- 네트워크는 msw로 대신하고, 처리하지 않은 요청은 오류로 만든다. 실제 서버를 부르지 않는다.
- 테스트 이름은 한국어로 동작을 서술한다(`'재발급에 성공하면 같은 요청을 한 번 다시 보낸다'`).
- 실패 경로(백엔드 장애, 거부, 동시 요청)를 정상 경로만큼 다룬다.
- BFF 라우트는 `Request`를 만들어 핸들러를 직접 호출하고, 단위 테스트에서 실제 라우팅과 같은 경로를 넘긴다.
- 테스트는 구현이 아니라 관찰할 수 있는 동작을 검증한다.

## 11. Git

- 브랜치: `feature/<설명>`, `fix/<설명>`, `chore/<설명>`
- 커밋 메시지는 conventional commits(`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`)로 쓴다. commitlint가 검사한다.
- 파일 이동과 동작 변경은 커밋을 나눈다. 리뷰가 쉬워진다.
- PR을 올리기 전에 `pnpm check`를 통과시킨다.
- 생성 파일(`src/lib/api/schema.d.ts`)은 `pnpm api:generate`로만 바꾸고 커밋한다. 백엔드 변경이 PR diff에 보이게 하려는 것이다.
