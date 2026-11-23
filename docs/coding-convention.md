# Coding Conventions

mediprice-frontend의 코딩 규칙입니다. 사람과 AI(Claude Code 등)가 일관된 코드를 쓰는 것이 목표입니다.
더 좋은 아이디어가 있거나 잘못된 내용이 있으면 누구나 언제든지 수정할 수 있습니다.

규칙 표기: **MUST**는 반드시 지킨다, **SHOULD**는 기본으로 지키되 합당한 이유가 있으면 예외를 허용한다. 표기가 없으면 SHOULD로 본다.

## 도구로 강제되는 규칙

| 도구                                                   | 설정                               | 검사 대상                                                                                                                                                         |
| ------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prettier                                               | `prettier.config.mjs`              | 포맷(작은따옴표, 후행 쉼표, Tailwind 클래스 정렬)                                                                                                                 |
| ESLint                                                 | `eslint.config.mjs`                | import 정렬, 미사용 import, `type` import, `no-floating-promises`, TanStack Query 규칙, Next 규칙                                                                 |
| ESLint `no-restricted-imports`                         | `eslint.config.mjs`                | 2.2 의존 방향 (`lib`·`components`는 `features`·`app`·`server`를, 클라이언트는 `server`를 import하지 않음), `components/primitives`는 `components/ui`에서만 import |
| ESLint `react/jsx-no-literals`, `no-restricted-syntax` | `eslint.config.mjs`                | 12장 화면 문구 하드코딩(JSX 텍스트, 한글 문자열), 8장 Tailwind 기본 팔레트·글자 크기·shadcn 별칭 클래스, `{error.message}` 출력, `toLocale*String`·`new Intl.*`   |
| ESLint `no-console`                                    | `eslint.config.mjs`                | `console.log` 금지 (`warn`·`error`는 허용)                                                                                                                        |
| next-intl 타입                                         | `src/i18n/next-intl.d.ts`          | `messages/ko`에 없는 메시지 키는 typecheck 실패                                                                                                                   |
| TypeScript `strict`                                    | `tsconfig.json`                    | `noUncheckedIndexedAccess`, `noImplicitOverride` 포함                                                                                                             |
| `server-only`                                          | `src/server/**`                    | 서버 전용 코드가 클라이언트 번들에 들어가면 빌드 실패                                                                                                             |
| knip                                                   | `knip.jsonc`                       | 쓰지 않는 파일·export·의존성                                                                                                                                      |
| commitlint + husky                                     | `commitlint.config.mjs`, `.husky/` | 11장 커밋 메시지, 커밋 전 lint·format                                                                                                                             |

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
- 12. 화면 문구와 다국어
- 13. 모바일과 반응형
- 14. 가격·지역 데이터 표시

## 1. 이름

### 1.1 식별자에는 영문/숫자만 허용 (MUST)

변수, 함수, 타입, 파일 이름에는 영어와 숫자만 쓴다. 한국어 발음을 영어로 옮기지 않는다(`juso` 대신 `address`). 사용자에게 보이는 문구는 코드에 쓰지 않고 메시지 파일에 둔다(12장).

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
- 예외: 값 하나를 골라 돌려주는 작은 순수 함수는 돌려주는 값 이름으로 짓는다. 문구 키는 `xKey`(`errorMessageKey`, `reviewStatusKey`), 링크 주소는 `xHref`(`consentHref`, `hospitalHref`), 무엇에서 꺼내는 값은 `xOf`(`sidoCodesOf`, `lowestOf`)다. 화면 문구를 고르는 훅은 `useXLabel`(`useCategoryLabel`)이다.
- `data`, `info`, `handle`, `util`, `common`, `manager`처럼 아무 데나 붙는 이름은 쓰지 않는다.
- 한 글자 이름은 짧은 콜백의 인자(`(h) => h.name`)나 반복 변수에만 쓴다.
- 서로 다른 계층에 같은 이름의 파일(`session.ts`)을 두지 않는다. 역할이 드러나게 짓는다(`refresh-session.ts`). 예외: `components/ui/x.tsx`가 shadcn 생성물 `components/primitives/x.tsx`를 감쌀 때는 같은 이름을 쓴다.

## 2. 폴더 구조와 의존 방향

### 2.1 구조

```text
src/
  env.ts                  검증된 환경변수
  config/                 법적 고지 사실(legal-facts.json)·약관 문서 버전(legal.ts), 사이트 주소 결정(site-url.ts)
  i18n/                   next-intl 설정과 화면 문구. 코드에는 키만 둔다(12장)
    request.ts            locale·시간대·포맷 설정
    formats.ts            날짜 포맷 이름
    message-scope.ts      브라우저에 넘기는 공용 문구 목록(CLIENT_NAMESPACES)
    client-messages.tsx   화면 전용 문구를 그 화면에만 더하는 ClientMessages
    messages/ko/*.json    화면 문구 (네임스페이스마다 파일 하나, messages/ko.ts가 합친다)
  app/                    라우팅 전용. 페이지는 features의 컴포넌트를 조립만 한다
    layout.tsx            html·폰트·NextIntlClientProvider·viewport·metadata
    providers.tsx         QueryClientProvider, 이동 기록(HistoryTracker)·이동 표시줄
    sitemap.ts 등         Next 메타 파일 (robots, manifest, opengraph-image, icon, not-found, global-error)
    _components/          여러 라우트의 메타데이터·OG 이미지가 함께 쓰는 조각 (open-graph.ts, og-image.tsx)
    (shell)/              상단 내비게이션이 있는 화면 (데스크톱 TopNav, 로그인 창·토스트는 여기서 한 번만 렌더)
      _components/        셸 조각 (내비게이션 목록, 라우트 오류 화면 등)
      (tabs)/             모바일 하단 탭바가 있는 탭 루트 화면 (홈 page.tsx·ai·favorites·my)
        _components/      홈 화면 조각
      (sub)/              하위 화면 (모바일은 페이지가 SubTopBar를 직접 렌더, 하단 탭바 없음)
        <route>/          search, items/[code], hospitals/[ykiho], compare, map, my/*, policy, privacy, terms
        _components/      하위 화면이 함께 쓰는 조각 (없는 화면 안내)
      admin/              운영자 화면 (AdminGate, 검색 제외)
    consent/              필수 동의 화면 (동의 전에는 다른 화면으로 가지 않게 셸 밖에 둔다)
    oauth/callback/       로그인 콜백 (토큰을 BFF 쿠키로 바꾸고 돌아간다)
    bff/                  BFF 라우트(핸들러는 얇게, 로직은 server/bff)
    <route>/_components/  그 라우트에서만 쓰는 조각 (Next의 private 폴더)
  features/<도메인>/      도메인 하나의 모든 것
    queries.ts            쿼리 키 + queryOptions (+ 뮤테이션 옵션)
    api.ts                생성 타입에 아직 없는 엔드포인트 호출 (7.2.1, 필요할 때)
    schemas.ts            폼·입력 zod 스키마 (필요할 때)
    components/           그 도메인의 UI (필요할 때)
    <역할>.ts             도메인 로직 (순수 함수, zustand 스토어, 훅)
  components/
    ui/                   디자인 시스템 컴포넌트 (Figma 컴포넌트와 1:1, 도메인 모름)
    layout/               여러 라우트가 공유하는 틀 (TopNav, MobileTopBar, SubTopBar, BottomTabBar, PageContainer, SiteFooter)
  lib/                    도메인을 모르는 공용 코드
    api/                  HTTP 클라이언트, 에러, 에러 코드 → 문구 키, 쿼리 직렬화, 재발급, 세션 만료 이벤트, schema.d.ts
    motion/               처음 보일 때 한 번 움직이기(useFirstView), reduced-motion 확인
    navigation/           앱 안 이동 깊이 기록(뒤로 가기를 앱 안에서 할 수 있는지), 저장 전 나가기 확인(useLeaveGuard), 앱 안 링크 클릭 판정(appLinkTarget)
    query-client.ts       QueryClient 기본값
    range-position.ts     최저~최고 막대 위의 위치 계산 (RangeBar, CompareStrip)
    safe-storage.ts       sessionStorage·localStorage를 예외 없이 읽고 쓰기 (zod 검증 포함)
    search-params.ts      URL 파라미터가 여러 번 오면 첫 값 고르기(firstParam)
    utils.ts              cn (토큰을 등록한 tailwind-merge)
  server/bff/             서버 전용 코드: 쿠키, 업스트림 호출, 재발급, 응답 헬퍼
  server/api/             서버 컴포넌트의 익명 공개 조회(publicApi, 요청마다 QueryClient, 404 판정, 홈·sitemap 데이터)
  test/                   테스트 공용 설정 (msw 서버, 요청 헬퍼)
```

`components/primitives/`(shadcn 생성물)는 지금 없다. `ui`가 `radix-ui`를 직접 써서 만들었다(6.5). `pnpm ui:add`로 생성물을 추가하면 이 폴더에 생기고, 그때부터 `components/ui`에서만 import한다(lint).

`features/<도메인>`은 지금 `admin`, `ai`, `auth`, `claims`, `comparison`, `favorites`, `feedback`, `history`, `hospitals`, `institutions`, `legal`, `live-fee`, `map`, `medical-profile`, `npay`, `recent-items`, `regions`, `reviews`, `search`가 있다. 필요할 때만 만들고 빈 폴더를 미리 만들지 않는다.

### 2.2 의존 방향 (MUST)

```text
app ──▶ features ──▶ components, lib
 │                      ▲
 └──▶ server ───────────┘      (server는 서버에서만 실행된다)
```

- `lib`, `components`는 `features`, `app`, `server`를 import하지 않는다. 도메인을 알면 `features`에 둔다.
- 클라이언트 코드(`features`, `components`, `lib`, `app`의 화면)는 `server`를 import하지 않는다. 예외는 `app/bff/**` 라우트, 서버 컴포넌트(`page.tsx`·`sitemap.ts`와 `import 'server-only'`를 둔 그 라우트의 조각)가 쓰는 `server/api/**`, 테스트다.
- `server/**`의 파일은 첫 줄에 `import 'server-only';`를 둔다.
- feature가 다른 feature에서 가져오는 것은 `queries.ts`와 `components/`, 그리고 여러 feature·화면이 함께 쓰도록 만든 공용 모듈뿐이다. 그 밖의 내부 파일을 직접 가져오지 않는다. 공용 모듈은 다음과 같다.
  - `auth`: `use-session.ts`(`useSession`, `useLoginGuard`), `login-dialog-store.ts`(`openLoginDialog`)
  - `feedback`: `toast-store.ts`
  - `regions`: `service-region.ts`, `format-location.ts`
  - `npay`: `average-verdict.ts`, `price-filters.ts`, `price-summary.ts`, `catalog.ts`, `use-category-label.ts`, `item-name.ts`
  - `map`: `map-geo.ts`, `map-params.ts`, `exact-distance.ts`, `use-distance-label.ts`
  - `hospitals`: `detail-links.ts`
- 새 파일을 다른 feature가 쓰게 되면 이 목록에 더한다. `app`은 조립하는 쪽이라 features의 어느 파일이든 import할 수 있다.
- 폴더를 넘나드는 import는 `@/` 절대 경로를 쓰고 `../..`는 쓰지 않는다.

**나쁜 예**

```ts
// src/lib/format.ts
import { hospitalKeys } from '@/features/hospitals/queries'; // lib이 도메인을 안다
```

**좋은 예**

```ts
// src/features/live-fee/components/live-fee-check.tsx
import { errorMessageKey } from '@/lib/api/error-message'; // features가 lib을 쓴다
```

### 2.3 코드를 어디에 둘까

위에서부터 차례로 물어보고, 처음 "예"가 나온 곳에 둔다.

0. 사용자에게 보이는 문구인가 → `i18n/messages/ko/<네임스페이스>.json` (코드에는 키만)
1. 한 라우트에서만 쓰는가 → `app/<route>/_components/`
2. 도메인을 전혀 모르는 범용 UI(버튼, 다이얼로그)인가 → `components/ui/`. shadcn 생성물을 쓰면 `components/primitives/`에 두고 `ui`에서만 감싼다
3. 여러 라우트가 공유하는 화면의 틀(헤더, 탭바)인가 → `components/layout/`
4. 병원, 후기, 로그인 같은 도메인을 아는 코드인가 → `features/<도메인>/`
5. 도메인을 모르는 로직(포맷, HTTP, 유틸)인가 → `lib/`
6. 서버에서만 실행되는가(쿠키, 백엔드 호출) → `server/`

`hooks/`, `utils/`, `types/`, `common/` 같은 전역 폴더는 만들지 않는다. 무엇이든 들어가서 위치가 겹치는 원인이 된다. `i18n/`은 설정과 문구 파일만 담는 폴더라 예외다.

### 2.4 쪼개는 기준

- 파일은 개념 하나만 담는다. 약 150줄을 넘거나 바뀌는 이유가 둘 이상이면 나눈다.
- 폴더는 같은 주제의 파일이 3개 이상 생길 때 만든다. 처음에는 평평하게 시작한다.
- 한 곳에서만 쓰는 코드는 쓰는 곳 옆에 둔다. 두 번째 사용처가 생기면 옮긴다.

## 3. 파일과 export

### 3.1 명명 export가 기본 (MUST)

`export default`는 Next가 요구하는 특수 파일(`page`, `layout`, `loading`, `error`, `not-found` 등)과 라이브러리가 요구하는 설정 파일(`next.config.ts`, `src/i18n/request.ts`)에서만 쓴다. 그 외에는 명명 export를 쓴다. 이름 변경과 자동 완성, 검색이 쉬워진다.

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

셸·공개 화면(홈·검색·항목·병원·지도·비교·관심·법률 문서 등)의 첫 로드에 들어가는 스키마는 `zod/mini`로 쓴다(`z.string().check(z.regex(...))`, `z.nullable(...)`). classic(`zod`)을 하나라도 import하면 그 화면 첫 번들에 classic 전체(약 12KB gz)가 더 들어간다. 첫 화면에 폼이 있는 라우트(AI, 운영자, 후기 작성, 내 정보 편집 등)의 폼 스키마는 classic을 쓴다. `app/client-zod.test.ts`가 이 경계를 검사한다.

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

### 6.5 컴포넌트 계층

| 계층                    | 내용                                                                                          | 규칙                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `components/primitives` | shadcn 생성물(Radix 동작 + 기본 마크업). 지금은 없다                                          | `pnpm ui:add <이름>`으로만 추가하고 고치지 않는다                                   |
| `components/ui`         | 우리 디자인 시스템. Figma 컴포넌트와 1:1 (`Button`, `Chip`, `PriceRange`, `ResponsiveDialog`) | cva + 토큰. 도메인을 모른다                                                         |
| `components/layout`     | 화면의 틀 (`TopNav`, `MobileTopBar`, `BottomTabBar`, `PageContainer`)                         | 도메인을 모른다. 로그인 메뉴 같은 도메인 조각은 `actions` 같은 slot prop으로 받는다 |
| `features/*/components` | 도메인 UI (`HospitalPriceGroupCard`)                                                          | `ui`·`layout`을 조립한다                                                            |

- Radix 동작이 필요 없는 것(Button, Chip, StatusChip, Tag, Skeleton, PriceRange, RangeBar, EmptyState, SectionHeader, SegmentedControl, RadioList)은 `ui`에서 직접 만든다(변형이 있으면 cva). `asChild`는 `radix-ui`의 `Slot`을 쓴다.
- 동작이 복잡한 것(Dialog, AlertDialog)은 지금 `ui`가 `radix-ui`를 직접 감싼다(`ResponsiveDialog`, `ConfirmDialog`). shadcn 마크업이 디자인과 맞으면 생성물을 primitives에 두고 감싸도 된다.
- 컴포넌트는 화면에서 필요해질 때 만든다. 미리 만들어 두지 않는다(knip이 쓰지 않는 파일을 막는다).
- `ui`에 같은 이름의 컴포넌트가 있으면 primitives를 직접 쓰지 않는다(lint).

### 6.6 props 패턴 (MUST)

```tsx
const chipVariants = cva(
  'inline-flex h-8 items-center rounded-full border px-3 text-label',
  {
    variants: {
      selected: {
        true: 'border-primary bg-primary-tint text-primary-text',
        false: 'border-border',
      },
    },
  },
);

export function Chip({
  className,
  selected,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof chipVariants>) {
  return (
    <button
      type="button"
      data-slot="chip"
      className={cn(chipVariants({ selected }), className)}
      {...props}
    />
  );
}
```

- 변형 이름은 Figma 변형 이름의 camelCase다. Figma에 없는 것은 QA에서 필요해서 더한 것이다.

| 컴포넌트 | 변형                                                                                             | 크기                                                                  | 기타                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Button` | `primary` `tint` `neutral` `outline` `danger`(삭제 확인) `dangerText` `ghost` `onTint`(색 면 위) | `lg` 52px(페이지 CTA) `md` 44px `sm` 36px(누르는 영역 44) `icon` 44px | `elevated`: 화면의 대표 행동 하나에만 그림자. `isLoading`: 너비·색·포커스 유지, 클릭 차단 |

- 비활성 스타일은 `inactive:` 변형으로 쓴다. `disabled` 속성과 `aria-disabled="true"`(asChild 링크)를 함께 잡고, 로딩 중(`data-loading`)은 뺀다.
- 버튼 문구는 줄바꿈된다(`text-balance`). 한 줄로 자르지 않는다. 버튼은 기본으로 줄어들지 않고(`shrink-0`, 카드의 "비교함 담기"가 찌그러지지 않게) 부모 폭을 넘지 않는다(`max-w-full`). 같은 줄의 긴 글은 `min-w-0 flex-1`로 줄어들게 하고, 버튼을 줄여야 하는 곳만 `className="shrink"`를 준다.
- 상태가 바뀔 때 포커스를 잃지 않게 한다. 로딩처럼 잠깐 막을 때는 `disabled` 대신 `aria-disabled`와 클릭 차단을 쓴다(`disabled`가 되면 브라우저가 포커스를 뺀다).
- 숨기는 문구는 `invisible`(`visibility: hidden`)이 아니라 `opacity-0`이나 `sr-only`를 쓴다. `invisible`은 접근성 이름까지 지운다.
- props 타입은 `ComponentProps<'요소'> & VariantProps<typeof xVariants>`이고, `className`은 `cn(xVariants(...), className)`로 항상 마지막에 합친다.
- 링크처럼 다른 요소로 렌더해야 하면 `asChild`(radix `Slot`)를 쓴다: `<Button asChild><Link href="/">…</Link></Button>`.
- React 19라서 `forwardRef`를 쓰지 않는다. `ref`는 일반 prop으로 넘어간다.
- `<button>`은 기본 `type="button"`이다. 폼 제출 버튼만 `type="submit"`을 명시한다.
- 루트 요소에 `data-slot="이름"`을 붙여 부모가 `[&_[data-slot=chip]]:`로 스타일을 줄 수 있게 한다.
- `xVariants`는 다른 파일이 쓸 때만 export한다.
- 모바일과 데스크톱 크기가 다르면 변형 문자열 안에 반응형 클래스를 쓴다(`'h-12 lg:h-14'`). 브레이크포인트별 prop을 만들지 않는다.

### 6.7 서버와 클라이언트

- `ui`·`layout` 컴포넌트는 지시어 없이 둬서 서버와 클라이언트 양쪽에서 쓴다. Radix나 상태를 쓰는 파일만 `'use client'`를 붙인다.
- `usePathname` 같은 클라이언트 훅은 작은 조각으로 뺀다(예: `NavLink`가 `aria-current`만 붙이고, 활성 스타일은 부모가 `aria-[current=page]:`로 준다).
- 서버 컴포넌트에서 클라이언트 컴포넌트로 함수(아이콘 컴포넌트 등)를 넘기지 않는다. 렌더한 요소(`icon: <Heart />`)를 넘긴다.

### 6.8 아이콘과 접근성

- 아이콘은 `lucide-react`를 쓴다. 굵기: 24px(내비게이션)는 `strokeWidth={2}`, 16–20px(버튼 안 등)는 `1.75`, 12px 이하는 `1.5`.
- 활성 상태는 색만으로 표시하지 않는다(MUST). 굵기·채운 아이콘·밑줄 중 하나를 함께 쓴다. 아이콘을 채울 때 안쪽 모양(집의 문)이 메워지면 path 순서를 바꾼 아이콘을 `createLucideIcon`으로 만든다(`app/(shell)/_components/house-icon.tsx`).
- 파란 면(`bg-primary`) 위의 포커스 가능한 요소는 부모에 `focus-inverse`를 붙여 흰 포커스 링을 쓴다.
- 셸 아래 화면은 본문을 `<main id="main">`으로 감싼다. 첫 Tab은 `SkipLink`("본문 바로가기")다.
- 화면마다 `generateMetadata`로 제목을 준다(`"%s | MediPrice"`).
- 장식용 아이콘에는 `aria-hidden="true"`를 붙인다. 아이콘만 있는 버튼은 `aria-label={t(...)}`가 필수다(MUST).
- 누를 수 있는 요소는 44×44px 이상이다. 보이는 크기가 더 작으면 `touch-target` 유틸리티로 누르는 영역만 넓힌다.
- DOM 테스트(jsdom, Testing Library)는 아직 쓰지 않는다. 상호작용 로직(필터 시트의 임시 선택과 적용 등)도 순수 함수로 빼서 테스트한다.

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

화면에서는 `useQuery(hospitalQueries.detail(id))`로 쓴다. `apiClient`는 브라우저 전용이라, 검색에 노출할 화면(항목·병원 상세)은 같은 옵션에 마지막 인자로 `publicApi`(`server/api/public-client.ts`, 쿠키 없는 익명 호출, Next 데이터 캐시 5분)를 넘겨 서버에서 채우고 `HydrationBoundary`로 넘긴다. 키가 같아 브라우저는 다시 읽지 않는다.

- 없는 코드는 서버에서 `loadOrNotFound`로 `notFound()`를 불러 HTTP 404로 끝낸다. 그 밖의 실패는 그 쿼리만 빼고 그려 브라우저가 다시 읽게 한다.
- 백엔드가 로그인 사용자의 상세 조회에 최근 본 기록을 남기므로, 서버가 채운 상세는 `useRecordView`(`features/history`)로 로그인했을 때만 BFF로 한 번 더 읽는다.

### 7.2.1 생성 타입에 아직 없는 엔드포인트

백엔드 브랜치에만 있고 배포·`pnpm api:generate`가 되지 않은 엔드포인트는 `features/<도메인>/api.ts`에서 `createApiFetch`로 `/bff/api/...`를 부르고, 응답을 zod로 검증한다(예: `features/ai/api.ts`, `features/live-fee/api.ts`). JSON을 주고받는 단순한 호출은 `createUntypedRequest`(`lib/api/untyped-request.ts`)를 쓴다(예: `features/auth/consent-api.ts`, `features/medical-profile/api.ts`). 배포된 백엔드에 아직 없는 경로는 404 `RESOURCE_NOT_FOUND`로 오므로, 화면은 이를 "아직 지원하지 않음"으로 다루고 막지 않는다(예: `/users/me`의 `requiredConsentsMissing`이 없으면 동의 화면을 띄우지 않는다). 실패는 같은 `ApiError`/`NetworkError`로 던져 `errorMessageKey`가 그대로 동작하게 한다. 파일에 "배포 후 생성 클라이언트로 바꾼다"는 한 줄 TSDoc을 남기고, 배포되면 `apiClient` + `unwrap`으로 옮긴다.

### 7.3 변경과 캐시

- 상태를 바꾸는 요청은 `useMutation`을 쓰고, 성공하면 관련 키를 무효화한다.
- 로그인과 로그아웃 때는 쿼리 캐시를 비운다. 이전 사용자의 데이터가 남으면 안 된다.

### 7.4 에러

- 에러는 `ApiError.code`로 분기한다. 메시지 문자열을 비교하지 않는다.
- 화면 문구는 `t(errorMessageKey(error))`로 고른다(`useTranslations('errors')`). 매핑은 `lib/api/error-message.ts`에 있고, 모르는 코드는 HTTP 상태로 고른다. 백엔드가 새 에러 코드를 추가하면 이 표와 `messages/ko/errors.json`에 함께 추가한다.
- 백엔드의 `message`와 `fieldErrors[].reason`은 화면에 출력하지 않는다(MUST). 백엔드 문구는 한국어로 고정돼 있고 `reason`은 Bean Validation 기본 문구다.
- 입력 검증 실패(`INVALID_INPUT`)는 `fieldErrors`의 `field`로 폼의 해당 칸을 찾아 `setError(field, { message: 'validation.invalid' })`처럼 키를 건다.
- 쿼리는 4xx를 재시도하지 않는다(`lib/query-client.ts`). 결과가 바뀌지 않고, 401은 재발급이 따로 처리한다.
- `MEDICAL_PROFILE_NOT_FOUND`처럼 "없음"이 정상인 404는 에러가 아니라 빈 상태다. `queryFn`에서 `null`로 바꿔 돌려준다.
- 에러를 삼키지 않는다. 처리할 수 없으면 위로 던진다.

## 8. 스타일

### 8.1 기본

- 스타일은 Tailwind 클래스로 쓰고, 조건부 클래스는 `cn()`으로 합친다.
- 변형(크기, 색상)이 있는 컴포넌트는 `cva`로 선언한다(6.6).
- `components/primitives/`의 shadcn 생성물은 직접 고치지 않는다. 바꾸고 싶으면 `components/ui/`에 감싸는 컴포넌트를 만든다.
- 인라인 `style`은 런타임 값을 CSS 변수로 넘길 때만 쓴다(``style={{ '--progress': `${pct}%` }}``).

### 8.2 디자인 토큰 (MUST)

토큰은 `src/app/globals.css`에 있다. Figma(MediPrice) 변수·텍스트 스타일·이펙트 스타일에서 시작했고, 대비와 가독성 QA에서 바꾼 값은 파일에 이유를 적어 두었다. Figma는 하나의 안이므로 QA 결과가 우선한다. 우리 코드는 이 이름만 쓴다.

| 종류     | 클래스 예                                                                                                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 색       | `bg-primary` `hover:bg-primary-hover` `active:bg-primary-pressed` `text-primary-text` `bg-primary-tint`(`-hover`, `-pressed`, 페이지 머리 띠) `bg-surface` `bg-surface-strong` `border-hairline`                                   |
| 글자색   | `text-text-primary` `text-text-secondary` `text-text-tertiary` `text-text-disabled` `text-on-primary`                                                                                                                              |
| 상태     | `text-positive` `bg-positive-tint` `text-warning` `bg-warning-tint` `text-danger` `bg-danger`(`-hover`, `-pressed`) `bg-danger-tint` `bg-overlay`                                                                                  |
| 선       | `border-border` `border-border-strong` `outline-focus-ring`, 파란 면 위는 `focus-inverse`                                                                                                                                          |
| 타이포   | `text-hero` `text-display` `text-title` `text-section` `text-heading` `text-subheading` `text-body-lg` `text-body`(16px) `text-body-sm`(15px) `text-label(-bold)` `text-caption(-strong/-bold)` `text-price-md/lg/xl` `text-field` |
| 모서리   | 카드·다이얼로그 `rounded-xl`, 버튼·입력·배너 `rounded-lg`, 타일·세그먼트·태그 `rounded-md`, 칩 `rounded-full`, 시트 상단 `rounded-t-3xl`, 모바일 페이지 머리 띠 아래 `rounded-b-4xl`(28px, `lg:rounded-none`)                      |
| 그림자   | `shadow-card` `shadow-cta-glow` `shadow-float` `shadow-sheet` `shadow-bar`. 쓰임은 카드·떠 있는 것(다이얼로그)·시트·하단 바·대표 CTA로만 나눈다                                                                                    |
| 레이아웃 | `max-w-page` `px-page`(16·24·32px + 노치) `py-section`(40 → lg 64px) `h-top-nav` `h-top-bar` `h-tab-bar` `pb-tab-bar` `pb-safe` `pt-safe` `px-safe` `pl-safe-<n>`·`pr-safe-<n>`(최소 여백과 노치 중 큰 값) `touch-target`          |
| 겹침     | `z-(--z-header)` `z-(--z-tab-bar)` `z-(--z-bottom-cta)` `z-(--z-overlay)` `z-(--z-toast)` `z-(--z-skip-link)`. 숫자 `z-40`을 직접 쓰지 않는다                                                                                      |
| 움직임   | 상태 전환은 `ease-standard` 150–200ms, 처음 나타나는 것(스크롤 등장·범위 막대·숫자 롤업)은 `ease-enter`. `prefers-reduced-motion`이면 전역에서 멈춘다(상태를 알리는 스피너만 `data-allow-motion`)                                  |

- 타이포는 모바일 우선이다. `hero` `display` `title` `section` `price-lg` `price-xl`은 모바일 값(28·28·24·20·22·26px)이고 `lg`부터 데스크톱 값(34·32·26·26·24·30px)으로 자동으로 바뀐다. 읽는 거리가 먼 데스크톱에서는 `caption`(13→14px), `body-sm`·`label`(15→16px)도 한 단계 커진다. 배경 그라데이션과 왼쪽 선 강조는 쓰지 않는다(단색 띠, 옅은 바탕으로 구분). 화면에서 `lg:text-*`를 따로 붙이지 않는다.
- 제목 크기는 단계를 따른다. 페이지 H1은 `text-display`(홈 히어로만 `text-hero`), 페이지 섹션 H2는 `text-section`(`SectionHeader`), 섹션 안 하위 묶음과 카드·알림·옆 칸 제목은 `text-heading` 이하를 쓴다. 어떤 제목도 그 화면의 H1보다 크게 보이지 않게 한다. 예외: 지도처럼 화면 대부분을 도구가 차지하는 화면의 도구 막대 H1과, 절이 많은 법률 문서의 절 H2는 `text-heading`을 쓴다.
- 타이포 토큰 하나에 크기·행간·자간·굵기가 함께 들어 있다. `font-bold` 같은 굵기 클래스를 따로 붙이지 않는다(활성 상태처럼 굵기만 바꿀 때는 예외).
- 본문은 16px(`text-body`)이 기본이다. 13px(`text-caption`)은 출처·날짜 같은 메타 정보에만 쓰고, 가격 조건("1회 기준")처럼 판단에 필요한 정보에는 쓰지 않는다.
- 대비: 글자는 배경과 4.5:1 이상(큰 글자 3:1). `text-tertiary`까지는 흰색·surface·surface-strong 위에서 통과한다. 입력창처럼 테두리만으로 구분되는 컨트롤은 `border-border`(1.3:1)가 아니라 `border-border-strong`(3.3:1)을 쓴다.
- Tailwind 기본 팔레트(`blue-600`, `slate-50`), `white`·`black`, 기본 글자 크기(`text-sm`~`text-9xl`), shadcn 별칭(`bg-background`, `text-muted-foreground`)은 쓰지 않는다(lint). 기본 팔레트는 CSS도 만들어지지 않는다.
- 간격은 Tailwind 기본 4px 단위를 그대로 쓴다(`gap-3` = 12px, `w-70` = 280px).
- arbitrary value(`[...]`)는 토큰으로 표현할 수 없을 때만 쓴다(safe-area 계산, grid template).
- 가격처럼 자릿수를 맞춰야 하는 숫자에는 `tabular-nums`를 쓴다. `text-price-*`에는 이미 들어 있다.
- 글자 크기에 따라 배치가 바뀌어야 하는 곳(필터 열 옆의 목록 행, 고정 바)은 화면 폭 `lg:`·`xl:` 대신 rem 단위 컨테이너 쿼리(`@container` + `@min-[50rem]:`)를 쓴다. rem 기준이라 글자를 200%로 키우면 좁은 배치로 바뀐다.
- 토큰을 추가하거나 이름을 바꾸면 `src/lib/utils.ts`의 `extendTailwindMerge` 목록도 고친다. 등록하지 않으면 `cn('text-title', 'text-text-primary')`에서 앞 클래스가 지워진다.
- 토큰 이름이 shadcn 별칭과 겹치지 않게 한다(예: 입력창 타이포가 `text-input`이면 `--color-input`과 겹쳐 색까지 바뀐다).
- 다크 모드는 없다.

### 8.3 움직임과 공용 조각

| 조각                                                                   | 쓰임                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RangeBar`(`components/ui/range-bar.tsx`)                              | `min` `max` `average?` `value`(이 병원 점, 필수) `valueLabel`(점 라벨, 필수. ui는 도메인 문구를 모르므로 호출부가 넘긴다) `comparison?`(`below`·`above`·`same`, 호출부가 `compareToAverage`로 계산) `size`(`md` 라벨 붙은 막대, `sm` 목록 행의 작은 막대) `showAverageTick?`(sm 평균 눈금 라벨). 평균이 가운데인 구간별 눈금(최저→평균 0–50%, 평균→최고 50–100%), 끝 라벨은 실제 최저·최고. 범위가 없거나 최저=최고면 그리지 않는다. 막대는 `aria-hidden`, 뜻은 sr-only 문장. 값 점이 있는 곳(항목 행, 병원 선택 항목)에서만 쓴다(14장) |
| `RollingNumber`(`components/ui/rolling-number.tsx`)                    | `value` `format?`(가격은 `(n) => t('won', { amount: n })`). 처음 보일 때와 값이 바뀔 때 0부터 굴린다. 접근성 이름은 최종값                                                                                                                                                                                                                                                                                                                                                                                                              |
| `Reveal`(`components/ui/reveal.tsx`)                                   | 스크롤 등장(12px 아래에서 떠오름). `asChild` `delayMs`. 서버 렌더·이미 보이는 것·reduced-motion은 그대로 보인다                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `PriceOverview`·`PriceSpread`·`AverageTag`(`features/npay/components`) | `PriceOverview`는 목록·카드의 평균 + "최저 N원 ~ 최고 N원 (세부 항목별 가격)" + 병원 수. `PriceSpread`는 그 범위 한 줄(15–16px, 머리·카드에서도 쓴다). 홈 목록처럼 좁은 곳은 `common.price.compactRange`("37만~495만원"). `AverageTag`는 "평균보다 N% 저렴" 꼬리표로, 평균의 1/3~3배 밖이면 "구성이 달라 비교 어려움"을 쓴다                                                                                                                                                                                                            |

- 움직임은 `lib/motion`의 `useFirstView`(처음 보일 때 한 번)와 `prefersReducedMotion`으로 만든다. 서버 렌더와 JS가 없을 때는 항상 최종 모습이다.
- 움직이는 숫자·막대는 장식이다. 같은 뜻을 글자로 함께 둔다.
- 자동으로 바뀌는 것은 멈춤 수단이 있어야 한다(MUST). 멈출 수 없는 자동 슬라이드는 쓰지 않는다.

### 8.4 폰트

Pretendard 하나만 쓴다. `app/layout.tsx`에서 `pretendard` 패키지의 dynamic subset CSS를 import한다. 화면에 필요한 글자 조각만 받으므로 `next/font/local`로 2MB 전체 파일을 받지 않는다.

### 8.5 shadcn 추가

```bash
pnpm ui:add dialog sheet   # components/primitives에 생성, cn import를 @/lib/utils로 바꿈
```

`components.json`의 `ui` 별칭이 `@/components/primitives`다. 생성물은 shadcn 별칭 색(`bg-popover`)을 쓰고, `globals.css`의 `:root`가 이를 우리 토큰으로 연결한다.

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
- 제목은 대문자로 시작하는 영어 단어로 시작하지 않는다(`subject-case`). `API`·`Permissions-Policy`처럼 시작하면 commitlint가 거부하니 한국어로 시작한다.
- 파일 이동과 동작 변경은 커밋을 나눈다. 리뷰가 쉬워진다.
- PR을 올리기 전에 `pnpm check`를 통과시킨다.
- 생성 파일(`src/lib/api/schema.d.ts`)은 `pnpm api:generate`로만 바꾸고 커밋한다. 백엔드 변경이 PR diff에 보이게 하려는 것이다.

## 12. 화면 문구와 다국어

지금은 한국어만 지원한다. 그래도 문구는 처음부터 메시지 파일로 분리해서, 영어는 파일을 추가하는 것으로 확장한다.

### 12.1 문구는 코드에 쓰지 않는다 (MUST)

사용자에게 보이는 모든 문구(본문, 버튼, `aria-label`, `placeholder`, `alt`, metadata)는 `src/i18n/messages/ko/<네임스페이스>.json`에 두고 키로 쓴다. 네임스페이스를 새로 만들면 `messages/ko.ts`에 추가한다. 화면마다 파일이 나뉘어 있어 여러 사람이 동시에 작업해도 충돌하지 않는다. lint가 JSX 텍스트와 한글 문자열을 막는다. 영어로 쓴 `aria-label`·`placeholder`는 lint가 잡지 못하므로 리뷰에서 본다.

예외: `server/**`, `app/bff/**`의 API 응답 본문(백엔드 계약을 흉내 내는 것이라 화면에 나가지 않는다), 테스트, 개발자용 `Error` 메시지(영어로 쓴다).

### 12.2 쓰는 법

```tsx
// 동기 컴포넌트(서버·클라이언트 모두)
const t = useTranslations('hospitals.detail');
<h2>{t('priceSection.title')}</h2>;

// async 서버 컴포넌트, generateMetadata
const t = await getTranslations('metadata');
```

- `queries.ts`, `lib`, zod 스키마는 번역하지 않고 키나 코드만 돌려준다. zod 메시지는 `validation.*` 키로 쓰고, 폼 필드가 `t()`로 바꾼다.
- 브라우저에는 필요한 문구만 넘긴다. 루트 provider는 셸과 여러 화면이 함께 쓰는 `CLIENT_NAMESPACES`(`i18n/message-scope.ts`)만 넘기고, 화면 전용 문구는 그 화면의 page·layout이 `<ClientMessages namespaces={['items', 'map.entry']}>`로 더한다(`legal.document`처럼 하위 묶음만 고를 수 있다). 클라이언트 컴포넌트에서 새 네임스페이스를 쓰면 둘 중 하나에 더한다. `i18n/client-namespaces.test.ts`가 클라이언트 컴포넌트의 `useTranslations` 키를 모아 빠진 것을 찾는다. 그래서 네임스페이스와 키는 문자열 리터럴(또는 `` `reason.${x}` ``처럼 앞부분이 고정된 템플릿)로 쓴다. `ClientMessages`는 page·layout이 돌려주는 최상위 요소로만 쓴다(테스트가 그 파일 전체를 감싼다고 본다).
- `useTranslations`는 다른 이름으로 가져오지 않는다(`import { useTranslations as useT }` 금지). 이름이 다르면 키 대조 테스트가 찾지 못한다.
- 문자열을 이어 붙이지 않는다. 변수는 ICU 자리표시자(`"{name}님"`), 강조는 `t.rich`를 쓴다.
- 개수는 숫자 형식으로 넣는다. 한국어는 단수·복수 구분이 없어 `"{count, number}곳"`과 `"{count, plural, other {#곳}}"`가 같은 결과라 둘 다 쓰인다. 값에 따라 문장이 바뀔 때(`=0 {보관하지 않음}`)만 plural이 필요하다. 문구 형식은 언어마다 따로라, 영어를 추가할 때 영어 파일에서만 plural(`one`·`other`)로 쓰면 된다(12.5).

### 12.3 키 이름

- 최상위 namespace는 `src/i18n/messages/ko/`의 파일 이름이다. 공용 `common`·`nav`·`metadata`·`errors`·`validation`, 화면 `home`·`search`·`items`·`hospitals`·`comparison`·`map`·`ai`·`library`(관심·최근 기록·의료 정보)·`mypage`·`reviews`·`claims`·`liveFee`·`legal`·`admin`, 로그인·동의 `auth`가 있다. 여러 단어면 camelCase다(`liveFee`).
- 그 아래는 화면 → 조각 → 의미 순서다(`hospitals.detail.priceSection.emptyTitle`). camelCase, 네임스페이스를 넣어 4단계 이하.
- 예외: 백엔드 enum·코드 값을 그대로 쓰는 키는 값 모양 그대로 둔다(`admin.batch.status.COMPLETED`, `common.category.1070Z`, `legal.countries.KR`, `hospitals.detail.hours.days.MON`). 코드가 ``t(`reason.${reason}`)``처럼 값으로 고르기 때문이다.
- 예외: 같은 모양의 항목을 나란히 두는 묶음은 한 단계 더(5단계) 쓴다. 마지막 단계가 enum 값인 묶음(`admin.claims.resolve.actions.RESTORE`)과 항목마다 `title`·`body`·`description`을 두는 묶음(`ai.voice.error.noSpeech.title`, `home.popular.items.implant.name`)이다. 전체 키 약 1,800개 중 5단계는 60개쯤이다.
- 키는 문구가 아니라 의미로 짓는다(`emptyTitle`, `submit`). 문구가 같아도 다른 화면의 키를 빌려 쓰지 않는다. 예외는 `common.actions.*`(닫기·취소·확인·초기화·적용·더 보기·다시 시도·뒤로 가기)다.
- 없는 키는 typecheck에서 실패한다(`src/i18n/next-intl.d.ts`가 `messages/ko.ts`에서 키 타입을 만든다).

### 12.4 숫자·가격·날짜 (MUST)

- 날짜와 숫자는 next-intl의 `useFormatter()`/`getFormatter()`로만 포맷한다. `toLocaleString`, `new Intl.*`를 직접 쓰지 않는다(lint).
- 시간대는 `src/i18n/request.ts`에서 `Asia/Seoul`로 고정했다. Vercel의 SSR은 UTC로 실행되므로, 직접 포맷하면 서버와 브라우저 결과가 달라 하이드레이션 오류가 난다.
- 날짜 포맷 이름은 `src/i18n/formats.ts`에 둔다(`format.dateTime(date, 'date')`).
- 가격은 메시지로 표현한다: `common.price.won` = `"{amount, number}원"`, `common.price.range` = `"{min, number}~{max, number}원"`, `common.price.none`. "원"의 위치는 언어마다 달라서 `formatWon` 같은 함수를 만들지 않는다.

### 12.5 영어를 추가할 때

1. `messages/en/*.json`과 `messages/en.ts`를 추가하고, ko와 키 집합이 같은지 확인하는 테스트를 만든다. 개수가 들어가는 문구(ko의 `{count, number}곳`)는 en에서 `{count, plural, one {# hospital} other {# hospitals}}`로 쓴다.
2. `request.ts`에서 locale을 고른다. 쿠키(`NEXT_LOCALE`)로 고르면 모든 페이지가 동적 렌더링이 된다. 검색 노출이 필요하면 `[locale]` 세그먼트와 proxy 라우팅으로 바꾼다.
3. `next-intl.d.ts`의 `Locale`을 `'ko' | 'en'`으로 넓힌다.
4. 언어 전환 UI를 만들고, 360px에서 긴 영어 문구가 넘치지 않는지 확인한다.

## 13. 모바일과 반응형

### 13.1 모바일 우선 (MUST)

한 라우트에 페이지 하나를 두고 반응형으로 만든다. 기본 클래스는 모바일(Figma 360px 시안) 기준이고, `lg:`(1024px)부터 데스크톱(Figma 1440px 시안) 레이아웃이다. `md:`는 모바일 레이아웃을 넓게 쓰는 구간이다.

```tsx
<div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
  <aside className="hidden shrink-0 lg:block lg:w-70">
    {/* 데스크톱 필터 열 280px */}
  </aside>
  <section className="flex-1">{/* 목록 */}</section>
</div>
```

### 13.2 셸

| 컴포넌트        | 보이는 곳 | 내용                                                                                                                            |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `TopNav`        | `lg` 이상 | 72px 상단 내비게이션. `app/(shell)/layout.tsx`가 렌더한다                                                                       |
| `MobileTopBar`  | `lg` 미만 | 탭 루트 화면의 56px 상단 바(로고·우측 동작). `(tabs)/layout.tsx`가 렌더한다                                                     |
| `SubTopBar`     | `lg` 미만 | 하위 화면의 뒤로 가기·제목 바(`components/layout/sub-top-bar.tsx`). `(sub)`의 페이지와 `admin` 셸(`AdminShell`)이 직접 렌더한다 |
| `BottomTabBar`  | `lg` 미만 | 64px 하단 탭바 + safe-area. `(tabs)`에서만 쓰고 본문에 `pb-tab-bar lg:pb-0`을 준다                                              |
| `PageContainer` | 모두      | 모바일 좌우 16px, 데스크톱 1200px 본문 폭                                                                                       |

내비게이션 항목은 `app/(shell)/_components/use-nav-items.tsx` 하나에서 정의하고 데스크톱과 모바일이 같은 이름(홈·AI 찾기·관심·내 정보)을 쓴다. 화면 폭에 따라 메뉴 이름을 바꾸지 않는다.

### 13.3 모달과 바텀시트

- 모바일은 바텀시트, 데스크톱은 가운데 모달인 화면(필터·정렬 시트, 로그인, 신고, 비교함)은 `ResponsiveDialog`(`components/ui/responsive-dialog.tsx`) 하나로 만든다. Radix Dialog 하나를 CSS로만 바꾼다: 기본은 `fixed inset-x-0 bottom-0 rounded-t-3xl shadow-sheet pb-safe`, `md:`(768px, 태블릿)부터 `top-1/2 left-1/2 -translate-1/2 rounded-xl shadow-float`. 태블릿에서 화면 폭 전체를 덮는 시트는 어색해서 모달 전환을 레이아웃 전환(`lg:`)보다 먼저 한다.
- JS로 화면 폭을 재서 다른 컴포넌트를 렌더하지 않는다(MUST). 서버 렌더링 결과와 달라져 하이드레이션 오류와 깜빡임이 생긴다.
- 확인 다이얼로그(삭제 확인 등, 320px)는 `ConfirmDialog`(`components/ui/confirm-dialog.tsx`)로, 모든 크기에서 가운데 모달이다.
- 데스크톱은 옆 열, 모바일은 시트인 필터는 같은 `FilterPanel`(`items/[code]/_components/filter-panel.tsx`)을 두 곳(`hidden lg:block`인 `FilterColumn`과 `lg:hidden`인 `FilterSheet`)에 렌더한다. 상태가 URL 쿼리에 있어 두 곳이 어긋나지 않는다(6.3).

### 13.4 모바일 세부 규칙

- 누를 수 있는 요소는 44×44px 이상이다(6.8). 모바일 누름 피드백은 `active:`로 준다(`hover:`는 마우스가 있는 기기에만 적용된다).
- 화면 높이는 `min-h-dvh`를 쓰고 `h-screen`을 쓰지 않는다(모바일 주소창 때문에 넘친다).
- 포커스·앵커 이동이 고정된 상단 바와 하단 탭바에 가려지지 않게 `globals.css`가 `scroll-padding`을 준다. 화면마다 `scroll-mt-*`를 붙이지 않는다.
- 하단 탭바 위에 붙는 바(비교함 등)는 `z-(--z-bottom-cta)`로 탭바 위에 쌓는다.
- 모바일에서 입력창에 포커스가 있으면 하단 탭바가 숨는다(`globals.css`의 `[data-bottom-tab-bar]` 규칙). 입력창을 화면 아래에 붙이는 화면(AI 대화 등)은 탭바가 있을 때와 없을 때의 높이를 모두 계산한다.
- 입력창 글자는 `text-field`(16px)를 쓴다. 16px보다 작으면 iOS Safari가 포커스할 때 화면을 확대한다.
- `viewport`는 `app/layout.tsx`에 있다(`viewportFit: 'cover'`로 safe-area 사용). 확대를 막는 설정(`maximumScale`, `userScalable`)은 넣지 않는다.
- 음성 입력·현재 위치는 `next.config.ts`의 `Permissions-Policy`에서 같은 출처(`self`)에만 허용돼 있고, 카메라는 쓰지 않아 막혀 있다(`camera=()`). 다른 출처의 iframe에서는 쓰지 않는다.

### 13.5 현재 위치: 개인위치정보를 받지 않게 설계 (MUST)

「위치정보의 보호 및 이용 등에 관한 법률」은 특정 개인의 위치를 알 수 있는 정보(개인위치정보)를 다루는 사업자에게 신고·동의·기록 보관 의무를 지운다. 주변 병원 찾기에는 1m 정밀도의 좌표가 필요 없으므로, 서버가 개인위치정보를 받지 않게 만든다.

- 서버(`/api/hospitals/nearby`)로 보내는 좌표는 `coarsenLatLng`(`features/map/map-geo.ts`)로 소수 둘째 자리(약 1km 격자)로 흐린다. 현재 위치든 지도 중심이든 같다. 정확한 좌표는 브라우저 상태로만 두고 URL·저장소에 남기지 않는다.
- 이 조회는 로그인 정보 없이 보낸다. 요청에 `ANONYMOUS_REQUEST_HEADER`(`lib/api/paths.ts`)를 붙이면 BFF가 쿠키가 있어도 Authorization을 붙이지 않는다(`isAnonymousRequest`). 흐린 위치도 계정과 묶이지 않는다.
- 정확한 좌표는 지도의 내 위치 점과 거리 계산에만 쓴다. 병원 좌표가 응답에 있으므로 거리와 가까운 순서는 `withExactDistances`로 브라우저에서 다시 잰다. 검색 범위는 흐린 중심 기준이라 "반경 약 N km"로 쓴다.
- 권한을 묻기 전 안내(`map.location.promptDescription`)와 개인정보 처리방침 14항에 같은 내용을 쓴다. 이 설계를 바꾸면(정확한 좌표를 서버로 보내는 기능 등) 위치정보법 검토부터 한다.

## 14. 가격·지역 데이터 표시

공개 가격 데이터의 특성 때문에 정한 규칙이다. 화면을 새로 만들 때도 지킨다.

- **지역 (MUST)**: 지역은 `features/regions/service-region.ts` 하나로 다룬다. 기본은 서울·경기(`metro`)이고 선택지는 서울·경기 / 서울 / 경기 / 전국(`all`)이다. URL 파라미터 이름은 `region`이고 기본값은 링크에서 뺀다. 백엔드가 시도 하나만 받으므로 서울·경기는 `sidoCodesOf`로 나눠 조회해 합친다.
- **가격 요약 (MUST)**: 최저~최고 범위를 대표값으로 내세우지 않는다. 범위는 "1일당 1,000원" 같은 예외 값에 끌려가 오해를 만든다. 평균을 크게, 범위와 병원 수를 작게 쓴다(`PriceOverview`). 여러 시도의 요약은 `npayQueries.summaryIn`이 합친다(평균은 가격 수로 가중).
- **값 점이 없는 범위 막대 금지 (MUST)**: `RangeBar`는 이 병원 값(`value`) 점이 있을 때만 쓴다. 막대는 평균을 가운데에 두는 눈금이라, 점이 없으면 평균 눈금이 늘 가운데에 있어 아무것도 알려 주지 않고 분포가 대칭인 것처럼 보인다. 점이 없는 곳(홈, 오늘의 가격, 항목 머리, 검색·분류 행, AI 결과)은 `PriceSpread` 글자나 `compactRange`로 쓴다.
- **세부 항목이 다른 가격 (MUST)**: 한 항목(예: 도수치료) 안의 세부 항목은 병원마다 시간·횟수·구성이 다르다. 도수치료 서울·경기 2,744건에서 15분 세션 중앙값은 30,000원(평균 118,384원의 0.25배), 30분 80,000원, 60분 150,000원, 100분 400,000원(3.4배)이었다. "[1일당]"은 심평원 청구 단위 표기라 345건(12.6%)에 붙지만 중앙값이 95,000원으로 전체(100,000원)와 같아 단위를 가르는 표시가 아니다. 그래서 다음을 지킨다.
  - 가격 옆에는 그 가격의 세부 항목 이름을 쓴다("도수치료F 기준"). 행의 꼬리표·막대·큰 가격·병원 화면 링크(`variant`·`price` 파라미터)는 모두 같은 세부 항목을 말한다. 병원 화면은 그 세부 항목을 먼저 고르고 같은 지역 평균과 견줘, 행의 꼬리표와 같은 숫자를 말한다.
  - 평균 대비 %는 가격이 평균의 1/3~3배 안일 때만 쓴다(`features/npay/average-verdict.ts`의 `judgeAgainstAverage`). 밖이면 "구성이 달라 비교 어려움"으로 쓴다. 이 범위는 도수치료 가격의 8.9%, 체외충격파 4.5%, 임플란트 1.1%, 라식·라섹·대상포진 예방접종 0%를 거른다.
  - 범위의 최저·최고는 세부 항목 하나의 값이라 "(세부 항목별 가격)"을 함께 쓴다.
  - 병원 비교(`features/comparison/compare-basis.ts`)는 모든 병원이 같은 이름으로 공개한 세부 항목이 있으면 그것끼리 견줘 "가장 저렴해요"라고 쓴다. 없으면 병원별 가장 낮은 공개 가격끼리 견주되 "가장 낮은 공개 가격은 OO병원이에요"라고 쓰고, 어느 세부 항목의 값인지 밝히고 금액 차이를 쓰지 않는다.
- **"최저" 낱말**: 범위의 끝은 "최저 N원 / 최고 N원", 한 병원의 세부 항목 중 가장 낮은 값은 "가장 낮은 가격", 비교한 병원 중 가장 낮은 곳의 꼬리표는 "최저"로 쓴다. "최저가"는 뜻이 섞여 쓰지 않는다.
- **병원 단위 (MUST)**: 가격 API는 병원의 세부 항목마다 한 줄을 준다. 병원을 비교하는 목록은 병원 하나에 카드 하나로 묶고, 세부 항목은 펼쳐서 보여 준다. 개수는 "병원 N곳"으로 쓴다.
- **분류 이름**: 홈 분류(`features/npay/catalog.ts`)에 속하는 코드는 쉬운 이름("물리치료·재활")을 먼저, 공식 이름("이학요법료")은 보조로 쓴다. 항목 이름의 "대분류/" 앞부분은 떼고 보여 준다(`formatItemPath`, 마지막 조각만 쓸 때는 `lastSegment`, `features/npay/item-name.ts`).
- **지역 이름**: 시도·시군구는 `formatLocation`으로 정리한다("부산 부산남구" → "부산 남구", "경기 부천원미구" → "경기 부천시 원미구").
- **없는 데이터**: 통계·업데이트 날짜·가격 범위 필터처럼 API가 없는 것은 그럴듯한 값으로 채우지 않고 뺀다. 빠진 것은 PR 설명에 적는다.
