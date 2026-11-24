# 현재 위치 사용 동의 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지도에서 현재 위치를 로그인 회원의 위치정보 이용 동의를 받은 뒤에만 쓰고, 동의·철회·이용 기록(좌표 없음)을 서버에 남긴다.

**Architecture:** 백엔드는 기존 동의 구조(`user_consent`, `ConsentService`)에 선택 항목 `LOCATION`을 더하고, 좌표 없는 이용 기록 테이블과 기록 API를 둔다. 프론트는 위치 사용 조건(로그인·동의·권한)을 순수 함수로 판단해 지도 흐름을 바꾸고, 위치 동의 창·내 정보 철회·위치기반서비스 이용약관 페이지를 더한다. 주변 병원 조회(`/api/hospitals/nearby`, 1km 흐린 좌표, 로그인 정보 없음)는 바꾸지 않는다.

**Tech Stack:** Spring Boot 4.1 / Java 21 / JPA·JdbcTemplate / Flyway SQL, Next.js 16 App Router / TanStack Query / zod / next-intl / vitest / Playwright.

**Spec:** `docs/superpowers/specs/2026-11-23-location-consent-design.md` (이 저장소)

## Global Constraints

- 저장소·브랜치: 백엔드 `/Users/khm1102/Documents/mediprice/mediprice-backend`는 `origin/dev`에서 `feature/location-consent`; 프론트 `/Users/khm1102/Documents/mediprice/mediprice-frontend`는 `feature/location-consent`(이미 체크아웃, `origin/feature/ui-conventions` 기준).
- 각 저장소 컨벤션을 따른다: 백엔드 `docs/coding-convention.md`·`AGENTS.md`(ApiDocs 패턴 §9, 인자 3개 이하·같은 타입 연속 금지 §7.7, 메소드 이름 동사형 §1.8), 프론트 `docs/coding-convention.md`(문구는 `src/i18n/messages/ko/*.json`, `../` import 금지, 주석은 한 줄 한국어 TSDoc).
- 버전 값: `LOCATION`·`PRIVACY` 모두 `2026-11-23`(새 시행일). TERMS·AGE_14·MEDICAL_PROFILE·REVIEW_POLICY는 그대로 `2026-11-19`.
- 좌표·IP는 어떤 테이블·로그에도 새로 저장하지 않는다.
- 법 조항 문구·번호를 지어내지 않는다. 운영자가 정할 값은 `legal-facts.json`에서 `null`(화면에 "운영자 확정 필요").
- 커밋 제목은 `type: 한국어로 시작`(프론트는 commitlint, 본문 한 줄 100자 이하). 커밋에 Co-Authored-By·"Generated with" 서명을 넣지 않는다.
- dev·main에 직접 push·merge하지 않는다. dev DB(Neon)에 V6를 적용하는 것은 사용자에게 다시 승인받는다(이 계획 범위 밖).
- 확인 명령: 백엔드 `./gradlew --no-daemon spotlessApply` 후 `./gradlew --no-daemon spotlessCheck checkstyleMain checkstyleTest test`; 프론트 `pnpm check`.

## Review Focus

1. 브라우저 권한이 이미 granted인 사용자가 로그아웃 상태로 `/map`에 들어오면 위치를 읽지 않아야 한다 → Task F3 `locationAccess` 테스트와 Playwright 확인.
2. 동의를 철회한 뒤 같은 탭에서 지도에 다시 들어오면 위치를 읽지 않아야 한다(동의 상태 캐시 무효화) → Task F1 `withdrawLocation` mutation 테스트(무효화), F4 Playwright.
3. 버전이 바뀐 옛 동의(`reconsentRequired=true`)는 동의 없음으로 취급해야 한다 → Task F3 `locationAccess` 테스트, Task B2 서비스 테스트(옛 버전 동의로 기록 요청 시 403).
4. 회원 탈퇴 뒤에도 위치 이용 기록이 남아야 한다 → Task B2 테스트.
5. 이용 기록 저장 실패(네트워크·403)가 주변 병원 검색을 막지 않아야 한다 → Task F3 Playwright에서 기록 API를 실패로 가로채 확인.

---

## 백엔드

### Task B1: 동의 항목 LOCATION과 V6 마이그레이션

**Files:**

- Modify: `src/main/java/com/mediprice/backend/domain/consent/ConsentType.java`, `ConsentProperties.java`
- Modify: `src/main/resources/application.yaml`(app.consent.versions), `src/test/resources/application-test.yaml`(필요하면), `.env.example`
- Create: `src/main/resources/db/migration/V6__location_consent.sql`
- Test: `src/test/java/com/mediprice/backend/domain/consent/ConsentServiceTest.java`, 기존 `FlywayMigrationTest`(PostgreSQL에서만 실행)

**Interfaces:**

- Produces: `ConsentType.LOCATION`(`required=false`), `ConsentProperties.Versions.location()`, 설정 키 `app.consent.versions.location: ${CONSENT_LOCATION_VERSION:2026-11-23}`, `privacy` 기본값 `2026-11-23`.
- Produces(DB): `user_consent.consent_type`에 `LOCATION` 허용, 테이블 `location_usage_log(id bigint identity pk, user_id bigint not null /*FK 없음*/, purpose varchar(30) not null check (purpose in ('NEARBY_HOSPITALS')), consent_version varchar(50) not null, used_at timestamptz not null default now())`, 인덱스 `idx_location_usage_log_user (user_id, used_at)`, `idx_location_usage_log_used_at (used_at)`.

- [ ] **Step 1: 실패하는 테스트** — `ConsentServiceTest`에 `getConsents_includesLocationAsOptional`(상태 목록에 `LOCATION`, `required=false`, `currentVersion="2026-11-23"`), `withdraw_location_allowed_andKeepsMedicalProfile`(철회 후 `agreed=false`, 의료 프로필은 그대로).
- [ ] **Step 2: 실행해 실패 확인** — `./gradlew --no-daemon test --tests '*ConsentServiceTest'` → `LOCATION` 없음으로 컴파일 실패.
- [ ] **Step 3: 구현** — enum에 `LOCATION(false)`, `ConsentProperties.currentVersion` switch와 `Versions`에 `location`, yaml·`.env.example`(`# CONSENT_LOCATION_VERSION=` 주석 형식은 기존 줄과 같게), `privacy` 기본값 변경. `ConsentType` Javadoc에 위치 동의 설명 한 줄.
- [ ] **Step 4: V6 작성** — V5와 같은 방식(`do $$ ... pg_constraint ... like '%consent_type%'`)으로 `user_consent`의 consent_type check를 지우고 `user_consent_consent_type_check`로 `('TERMS','PRIVACY','AGE_14','MEDICAL_PROFILE','LOCATION')` 재생성 + 위 테이블·인덱스. 파일 머리 주석에 "탈퇴해도 남긴다(FK 없음), 좌표·IP 없음, 보관 기간은 운영자 값" 명시.
- [ ] **Step 5: 확인** — 전체 확인 명령 통과. PostgreSQL 검증은 일회용 컨테이너로: `docker run -d --rm --name mp-ci-pg -e POSTGRES_DB=mediprice_test -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -p 55499:5432 postgres:16` 후 `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:55499/mediprice_test SPRING_DATASOURCE_USERNAME=test SPRING_DATASOURCE_PASSWORD=test ./gradlew --no-daemon test --rerun-tasks` → 실패·건너뜀 0, 끝나면 `docker rm -f mp-ci-pg`.
- [ ] **Step 6: 커밋** — `feat: 위치정보 이용 동의 항목(LOCATION)과 위치 이용 기록 테이블(V6) 추가`

### Task B2: 위치 이용 기록 API

**Files:**

- Create: `src/main/java/com/mediprice/backend/domain/location/LocationUsageLog.java`(엔티티), `LocationUsageLogRepository.java`, `LocationUsageService.java`, `LocationUsageApiController.java`, `dto/LocationUsageRequest.java`, `LocationUsagePurpose.java`(enum `NEARBY_HOSPITALS`), `error/LocationErrorCode.java`
- Create: `src/main/java/com/mediprice/backend/global/swagger/LocationUsageApiDocs.java`; Modify: `ApiTag.java`(기존 `PRIVACY` 태그를 쓰면 추가 없음)
- Test: `src/test/java/com/mediprice/backend/domain/location/LocationUsageApiTest.java`, `ApiDocsTest.java`(경로 존재)

**Interfaces:**

- Consumes: `ConsentService.lookupActiveAgreement(Long userId, ConsentType type) -> Optional<UserConsent>`, `ConsentService.isCurrentVersion(ConsentType, String) -> boolean`.
- Produces: `POST /api/users/me/location-usages` 본문 `{"purpose":"NEARBY_HOSPITALS"}` → 204; 현재 버전 `LOCATION` 동의가 없으면 403 `LOCATION_CONSENT_REQUIRED`; 로그인 없으면 401. `LocationUsageService.record(Long userId, LocationUsagePurpose purpose) -> void`. `LocationUsageLogRepository.findAllByUserIdOrderByUsedAtDesc(Long userId) -> List<LocationUsageLog>`(B3 내보내기가 씀).

- [ ] **Step 1: 실패하는 테스트** — `LocationUsageApiTest`(MockMvc, 기존 `MedicalProfileApiTest`·`ConsentApiTest` 방식): `record_withCurrentConsent_returns204_andStoresRowWithoutCoordinates`(행 1개, purpose·consent_version=`2026-11-23`), `record_withoutConsent_returns403`, `record_withOutdatedConsentVersion_returns403`(옛 버전 행을 직접 넣고), `record_afterWithdrawConsent_returns403`, `record_withoutLogin_returns401`, `userWithdraw_keepsLocationUsageRows`(회원 탈퇴 API 호출 후 행 수 그대로), `record_invalidPurpose_returns400`.
- [ ] **Step 2: 실패 확인** — `./gradlew --no-daemon test --tests '*LocationUsageApiTest'` → 404/컴파일 실패.
- [ ] **Step 3: 구현** — ApiDocs 인터페이스에 매핑·`@Valid`·`@SecurityRequirement(BEARER_AUTH_SCHEME)`·`@Tag(ApiTag.PRIVACY)`, summary "위치 이용 기록", description에 "좌표는 받지도 저장하지도 않는다, 동의 없으면 403 LOCATION_CONSENT_REQUIRED". 서비스는 `lookupActiveAgreement`로 찾은 동의의 버전이 `isCurrentVersion`인지 보고 아니면 예외, 맞으면 `consent_version`을 그 값으로 저장. 에러 코드 `LOCATION_CONSENT_REQUIRED(HttpStatus.FORBIDDEN, "현재 위치를 쓰려면 위치정보 이용 동의가 필요합니다.")`.
- [ ] **Step 4: 통과 확인** — 같은 명령 PASS, 전체 확인 명령 통과.
- [ ] **Step 5: 커밋** — `feat: 위치 이용 기록 API 추가(좌표 없이 회원·시각·목적만 저장)`

### Task B3: 보관 기간 삭제, 내 데이터 내려받기, 운영 문서

**Files:**

- Modify: `global/retention/RetentionTarget.java`(`LOCATION_USAGE_LOG("location_usage_log", "used_at < ?")`), `RetentionProperties.java`(`@Nullable Integer locationUsageDays`, `requirePositive`, `daysOf`), `application.yaml`(`location-usage-days: ${RETENTION_LOCATION_USAGE_DAYS:}`), `.env.example`
- Modify: `domain/mypage/export/MyDataExportService.java`, `dto/MyDataExportResponse.java`; Create: `dto/ExportedLocationUsage.java`(`record ExportedLocationUsage(String purpose, String consentVersion, Instant usedAt)`)
- Modify: `docs/operations.md`(7장 보관 표에 행, 위치 동의·기록 설명 절, Flyway 적용 현황 표에 V6 "dev 미적용")
- Test: `RetentionPropertiesTest`, `RetentionPurgerTest`, `MyDataExportApiTest`, `ApiDocsTest`(export 응답의 `locationUsages` 필드)

**Interfaces:**

- Consumes: B2의 `LocationUsageLogRepository.findAllByUserIdOrderByUsedAtDesc`.
- Produces: `MyDataExportResponse`의 새 컴포넌트 `List<ExportedLocationUsage> locationUsages`(마지막에 추가, JSON 필드 `locationUsages`).

- [ ] **Step 1: 실패하는 테스트** — `RetentionPropertiesTest.locationUsageDays_mustBePositive`, `RetentionPurgerTest`에 location_usage_log 기한 지난 행만 지우는 경우(기존 테이블별 행 수 Map 방식 확장), `MyDataExportApiTest.export_includesLocationUsages_newestFirst`.
- [ ] **Step 2: 실패 확인** — 해당 테스트 실행 → 실패.
- [ ] **Step 3: 구현** — 위 Files대로. RetentionJob 로그 설정 출력에 새 대상이 자동 포함되는지 확인.
- [ ] **Step 4: 통과 확인** — 전체 확인 명령 + B1 Step 5의 PostgreSQL 실행.
- [ ] **Step 5: 커밋** — `feat: 위치 이용 기록을 보관 기간 삭제와 내 데이터 내려받기에 포함`
- [ ] **Step 6: push·PR** — `git push -u origin feature/location-consent`, `gh pr create --base dev`(제목 `feat: 현재 위치 사용 동의(LOCATION)와 좌표 없는 위치 이용 기록`, 본문에 API·V6·dev DB 미적용·운영자 값 목록. 서명 줄 없음).

## 프론트엔드

### Task F1: 동의·이용 기록 API와 쿼리

**Files:**

- Modify: `src/features/auth/consent-api.ts`(`ConsentType`에 `'LOCATION'`, `withdraw(type)`), `src/features/auth/queries.ts`(`consentMutations.agreeLocation`, `consentMutations.withdrawLocation`), `src/config/legal.ts`(`LEGAL_DOCUMENT_VERSIONS.LOCATION: '2026-11-23'`, `PRIVACY: '2026-11-23'`)
- Create: `src/features/map/location-usage-api.ts`, 테스트 `location-usage-api.test.ts`; Modify: `src/features/map/queries.ts`(`locationUsageMutations.record`)
- Modify: `src/lib/api/error-message.ts`(`LOCATION_CONSENT_REQUIRED` → 기존 권한 계열 키 또는 새 `errors.locationConsentRequired`)
- Test: `src/features/auth/consent-api.test.ts`(없으면 생성), `src/features/auth/queries.test.ts`

**Interfaces:**

- Produces: `consentApi.withdraw(type: ConsentType): Promise<void>` → `DELETE /api/users/me/consents/{type}`; `consentMutations.agreeLocation(queryClient)` → `consentApi.save([{type:'LOCATION', version: LEGAL_DOCUMENT_VERSIONS.LOCATION, agreed:true}])`, 성공 시 `setQueryData(consentKeys.status(), saved)`; `consentMutations.withdrawLocation(queryClient)` → 성공 시 `invalidateQueries(consentKeys.status())`; `locationUsageApi.record(): Promise<void>` → `POST /api/users/me/location-usages` 본문 `{"purpose":"NEARBY_HOSPITALS"}`; `locationUsageMutations.record()`; `isLocationConsentActive(status: ConsentStatus | undefined): boolean`(`LOCATION` 항목이 `agreed && !reconsentRequired`) — `src/features/auth/consent-status.ts`(새 파일)에.

- [ ] **Step 1: 실패하는 테스트** — 가짜 `createUntypedRequest`(기존 consent-api 생성자 주입)로 `withdraw('LOCATION')`가 `DELETE /api/users/me/consents/LOCATION`을 부름; `location-usage-api.test.ts`가 POST 경로·본문; `consent-status.test.ts`: `LOCATION` 없음→false, `agreed:false`→false, `agreed:true, reconsentRequired:true`→false, `agreed:true, reconsentRequired:false`→true, `undefined`→false; `queries.test.ts`: `withdrawLocation` 성공 시 `consentKeys.status()` 무효화.
- [ ] **Step 2: 실패 확인** — `pnpm exec vitest run src/features/auth src/features/map` → FAIL.
- [ ] **Step 3: 구현** — 위 Interfaces대로. 204 응답 처리는 기존 `untyped-request`의 본문 없는 성공 처리 사용.
- [ ] **Step 4: 통과 확인** — 같은 명령 PASS, `pnpm exec tsc --noEmit -p .` 오류 0.
- [ ] **Step 5: 커밋** — `feat: 위치 동의 저장·철회와 위치 이용 기록 API 추가`

### Task F2: 위치 사용 조건 판단과 로그인 뒤 이어 하기

**Files:**

- Create: `src/features/map/location-access.ts`, `location-access.test.ts`, `src/features/map/pending-location.ts`, `pending-location.test.ts`

**Interfaces:**

- Produces:
  - `type LocationAccess = 'signedOut' | 'needsConsent' | 'ready'`; `locationAccess(input: { isSignedIn: boolean; isConsentActive: boolean }): LocationAccess`.
  - `shouldLocateOnEntry(input: { access: LocationAccess; permission: LocationPermission }): boolean` — `access === 'ready' && permission === 'granted'`일 때만 true.
  - `savePendingLocation(path: string, now?: number): void`, `takePendingLocation(currentPath: string, now?: number): boolean` — `pending-favorite.ts`와 같은 방식(sessionStorage 키 `mediprice:pending-location`, 15분, 한 번만).

- [ ] **Step 1: 실패하는 테스트** — `locationAccess`: 비로그인→`signedOut`(동의 값 무관), 로그인·동의 없음→`needsConsent`, 둘 다→`ready`. `shouldLocateOnEntry`: `signedOut`+`granted`→false, `needsConsent`+`granted`→false, `ready`+`prompt`→false, `ready`+`granted`→true. pending: 같은 경로·15분 안→true 후 다시 부르면 false, 다른 경로→false, 15분 넘음→false, 깨진 JSON→false.
- [ ] **Step 2: 실패 확인** — `pnpm exec vitest run src/features/map/location-access.test.ts src/features/map/pending-location.test.ts` → FAIL.
- [ ] **Step 3: 구현** — 위 시그니처대로.
- [ ] **Step 4: 통과 확인** — PASS.
- [ ] **Step 5: 커밋** — `feat: 현재 위치 사용 조건 판단과 로그인 뒤 이어 하기 추가`

### Task F3: 지도 흐름과 위치 동의 창

**Files:**

- Create: `src/features/map/components/location-consent-dialog.tsx`
- Modify: `src/app/(shell)/(sub)/map/_components/use-map-search.ts`, `map-view.tsx`, `location-notice-banner.tsx`(필요하면)
- Modify: `src/features/auth/login-dialog-store.ts`(`LoginReason`에 `'location'`), `src/i18n/messages/ko/auth.json`(`loginDialog.reason.location`), `src/i18n/messages/ko/map.json`(`locationConsent.*` 추가, 쓰지 않게 된 `location.prompt*` 삭제)

**Interfaces:**

- Consumes: F1 `isLocationConsentActive`, `consentQueries.status()`, `consentMutations.agreeLocation`, `locationUsageMutations.record`; F2 `locationAccess`, `shouldLocateOnEntry`, `savePendingLocation`, `takePendingLocation`; 기존 `useSession`, `openLoginDialog({reason:'location'})`, `useGeolocation`.
- Produces: `LocationConsentDialog({ open, onOpenChange, onAgree, isSaving }: {...})` — 5장 그림의 항목(목적·항목·보유·거부), `/location-terms` 링크(새 탭 아님, 동의 창은 닫지 않음), 필수 체크박스, 체크 전 확인 버튼 비활성. 보유 기간은 `LEGAL_FACTS.retention.locationUsageDays`(F5에서 추가)를 ICU `{days, plural, ...}` 또는 `PendingFact`로.

- [ ] **Step 1: `use-map-search.ts` 바꾸기**
  - 진입: `start(permission)`는 `shouldLocateOnEntry`가 true일 때만 `locate()`. 아니면 `showFallbackIfEmpty()`; denied면 기존 `denied` 안내. 자동 안내 창과 `PROMPT_DISMISSED_KEY`는 없앤다(아니면 `deferred` 안내).
  - 세션·동의 상태가 늦게 오면(pending→authenticated) 진입 판단을 한 번 다시 한다.
  - `requestLocation()`: `signedOut` → `savePendingLocation(현재 경로)` 후 `openLoginDialog({reason:'location'})`; `needsConsent` → 동의 창 열기; `ready` → 기존처럼(권한 prompt면 브라우저가 묻는다) `locate()`.
  - 로그인 후 같은 경로로 돌아오면 `takePendingLocation`이 true일 때 `requestLocation()`을 이어서 한 번.
  - `locate()`가 `located`면 `locationUsageMutations.record()`를 실패 무시로 한 번 부른다(검색은 기다리지 않음).
  - 반환값: `isPromptOpen`/`answerPrompt` 대신 `isConsentOpen`, `closeConsent()`, `agreeConsent()`(저장 성공 → `locate()`, 실패 → 기존 에러 토스트 `errors.*`).
- [ ] **Step 2: `LocationConsentDialog`와 `map-view.tsx`** — `ConfirmDialog` 자리를 `LocationConsentDialog`로. 기존 위치 동의 계열 창(의료 프로필 동의)과 같은 스타일·부품(`ResponsiveDialog`, `Button`, 체크박스 부품).
- [ ] **Step 3: 확인(Playwright, 스크립트는 scratchpad)** — 390·1440에서:
  - 비로그인 + `context.grantPermissions(['geolocation'])` + `setGeolocation` → `/map` 진입 시 위치를 읽지 않음(“현재 위치 기준” 안내 없음, nearby 요청 좌표가 지역 중심)
  - 비로그인 "내 위치 사용" → 로그인 창(reason 문구)
  - `mockLogin` + 동의 상태 LOCATION 없음(route로 consents 응답) → 버튼 → 동의 창, 체크 전 확인 비활성, 동의 → POST consents 본문에 `LOCATION`/`2026-11-23` → 위치 찾기 → POST location-usages 1회
  - location-usages를 500으로 가로채도 주변 목록이 뜸
  - 동의 있음 + granted → 진입 즉시 현재 위치
  - 콘솔 오류·hydration 경고 없음, 200% 글자에서 동의 창 넘침 없음
- [ ] **Step 4: 확인 명령** — `pnpm exec tsc --noEmit -p .`, `pnpm exec eslint <바꾼 파일> --max-warnings=0`, `pnpm exec vitest run src/features/map src/features/auth`.
- [ ] **Step 5: 커밋** — `feat: 지도에서 로그인·위치 동의를 받은 뒤에만 현재 위치 사용`

### Task F4: 내 정보에서 위치 동의 철회, 탈퇴 안내

**Files:**

- Create: `src/app/(shell)/(sub)/my/account/_components/location-consent-section.tsx`
- Modify: `src/app/(shell)/(sub)/my/account/_components/account-view.tsx`, `withdraw-dialog.tsx`(안내 한 줄), `src/i18n/messages/ko/mypage.json`

**Interfaces:**

- Consumes: F1 `consentQueries.status()`, `isLocationConsentActive`, `consentMutations.withdrawLocation`, 기존 `ConfirmDialog`, `showToast`.
- Produces: `LocationConsentSection()` — 상태(동의함 + `format.dateTime(agreedAt,'date')` / 동의하지 않음), 동의함이면 "철회" → 확인 창 → 철회 → 토스트. 동의하지 않음이면 "지도에서 내 위치 사용을 누르면 동의할 수 있어요" 안내만.

- [ ] **Step 1: 구현** — 기존 `my-data-section.tsx`의 카드 모양을 따른다. 탈퇴 확인 문구에 "위치 이용 기록(좌표 없음)은 탈퇴 뒤에도 보관 기간 동안 남아요" 추가.
- [ ] **Step 2: 확인(Playwright)** — `mockLogin` + 동의 상태 LOCATION agreed → 줄 표시 → 철회 → DELETE `/bff/api/users/me/consents/LOCATION` 1회 → 상태 갱신, 이어서 `/map`으로 가면(granted) 위치를 읽지 않음. 390·1440, 콘솔 오류 없음.
- [ ] **Step 3: 확인 명령** — tsc, eslint(바꾼 파일), vitest 관련 경로.
- [ ] **Step 4: 커밋** — `feat: 내 정보에서 위치정보 이용 동의 철회`

### Task F5: 위치기반서비스 이용약관, 처리방침, 법률 값

**Files:**

- Create: `src/app/(shell)/(sub)/location-terms/page.tsx`, `_components/location-terms-document.tsx`, `src/i18n/messages/ko/legal.json`의 `locationTerms.*`
- Modify: `src/config/legal-facts.json`, `src/config/legal.ts`(zod: `retention.locationUsageDays: number().int().positive().nullable()`, `locationService: z.object({ reportNumber: text.nullable() })`), `src/config/legal-config.launch.test.ts`(새 null도 잡는지)
- Modify: `legal.json` 처리방침 14항·수집 항목 표 위치 줄·보유 기간 표, `src/components/layout/site-footer.tsx`(`{ key: 'locationTerms', href: '/location-terms', emphasized: false }`), `src/app/sitemap.ts`(정적 경로에 있으면 추가), `docs/coding-convention.md` §13.5, `docs/legal-launch-checklist.md`(새 운영자 값)

**Interfaces:**

- Consumes: 기존 `LegalDocument`, `LegalSection`, `FactList`, `PendingFact`, `legalRichTags`, `LEGAL_DOCUMENT_VERSIONS.LOCATION`.
- Produces: `/location-terms` 페이지(metadata 제목 `locationTerms.title`, canonical), 9개 절(스펙 8장 순서: 목적, 서비스 내용, 이용 요금, 개인위치정보의 이용·보유, 동의와 철회, 이용자의 권리, 만 14세 미만, 사업자 정보, 시행일). 법 조항 번호·인용 없이 서비스 사실만.

- [ ] **Step 1: 실패하는 테스트** — `legal-config.launch.test.ts`에 `retention.locationUsageDays`, `locationService.reportNumber`가 null이면 실패 목록에 들어가는지(기존 null 검사 방식 확장). 일반 `pnpm test`에서는 이 파일이 건너뛰어지는지 그대로 유지.
- [ ] **Step 2: 실패 확인** — `pnpm launch:check` → 새 항목 이름이 실패 목록에 보임(기존 null들과 함께, 원래도 실패하는 명령이라 새 이름이 나오는지만 본다).
- [ ] **Step 3: 구현** — 위 Files대로. 처리방침 14항: "로그인 회원이 위치정보 이용에 동의하고 기기 권한을 허용했을 때만 현재 위치를 쓴다, 서버에는 약 1km 흐린 좌표를 로그인 정보 없이 보내고 저장하지 않는다, 위치를 쓴 시각·목적만 회원 번호와 함께 보관 기간 동안 기록한다(탈퇴 후에도), 내 정보에서 철회할 수 있다". 시행일은 `LEGAL_DOCUMENT_VERSIONS.PRIVACY`에서 읽는 기존 방식 그대로.
- [ ] **Step 4: 확인** — `pnpm check` 통과, Playwright로 `/location-terms`·`/privacy` 390·1440(“운영자 확정 필요” 표시, 콘솔 오류 없음), 바닥글 링크.
- [ ] **Step 5: 커밋** — `feat: 위치기반서비스 이용약관 페이지와 처리방침 위치 항목 갱신`

### Task F6: 마무리와 PR

- [ ] **Step 1: 전체 확인** — `pnpm check`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000 NEXT_PUBLIC_API_URL=http://localhost:8080 pnpm exec dotenv -e .env.example -- next build` → exit 0.
- [ ] **Step 2: push·PR** — `git push -u origin feature/location-consent`, `gh pr create --base feature/ui-conventions`(제목 `feat: 현재 위치 사용 동의(로그인·위치 동의 후에만 위치 사용)`, 본문: 흐름, 백엔드 PR 의존, PRIVACY 버전 상향 영향, 운영자 값, 서명 줄 없음).
- [ ] **Step 3: 보고** — 사용자에게 dev DB V6 적용 승인 요청(백엔드 PR 머지 전 필요: 없으면 동의 저장이 check 제약에 걸려 실패).
