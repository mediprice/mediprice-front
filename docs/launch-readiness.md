# 출시 준비 현황 (2026-11-20)

실제 출시를 기준으로 저장소 세 곳(frontend, backend, ai)에서 한 작업과 남은 결정을 모은 문서다. 법률 문서의 확정 정보는 [legal-launch-checklist.md](./legal-launch-checklist.md)를 따른다.

## 1. 브랜치와 합치는 순서

모든 브랜치는 push했고 PR을 열었다. dev·main에는 아직 아무것도 합치지 않았다.

| 저장소   | 브랜치                         | 기준                       | 내용                                                                                                                                                | PR    |
| -------- | ------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| frontend | `feature/ui-conventions`       | main                       | 1차본(컨벤션, 화면 전체, BFF)                                                                                                                       | #2    |
| frontend | `feature/design-upgrade`       | `feature/ui-conventions`   | 기존 디자인 고도화: 리브랜딩 기간의 기능(가격 정직성, 가격 위치 표시, 네이버 지도, 법률 문서·동의, 권리침해 신고, SSR, 출시 기반)을 기존 디자인으로 | 새 PR |
| frontend | `feature/redesign-big-numbers` | `feature/ui-conventions`   | 리브랜딩(큰 숫자) 안. 합치지 않고 비교용으로 남겨 둠                                                                                                | #3    |
| backend  | `fix/frontend-integration`     | dev                        | 프론트 연동(리다이렉트, CORS, AI 프록시, 다중 시도)                                                                                                 | #14   |
| backend  | `feature/launch-hardening`     | `fix/frontend-integration` | Flyway(기본 꺼짐), health, AI 한도 DB 저장·전체 상한, IP 속도 제한, prod 필수값 검사, 세션 쿠키, AI 로그·state 검증                                 | #15   |
| backend  | `feature/privacy-consent`      | `fix/frontend-integration` | 동의 기록(V4), 의료 정보 별도 동의, 관리자 접속 기록, 내 데이터 내려받기                                                                            | #16   |
| backend  | `feature/public-stats`         | `fix/frontend-integration` | 홈 통계(`/api/stats`), 사이트맵 병원 목록, 인기 항목 순위(최근 30일, 5명 미만 제외)                                                                 | #17   |
| backend  | `feature/review-claims`        | `feature/privacy-consent`  | 후기 권리침해 신고(비회원 가능)와 임시조치 30일(V5), 작성자 재게시 요청, 관리자 처리·알림 기록, 기한 지난 신고 표시                                 | #18   |
| backend  | `feature/retention-jobs`       | `feature/review-claims`    | 보관 기간이 지난 최근 기록·처리된 신고·권리침해 신고·관리자 접속 기록 일일 삭제(기간을 정하지 않으면 꺼짐, dry-run 기본)                            | #19   |
| backend  | `feature/price-band-ai-area`   | `fix/frontend-integration` | 가격 목록·요약의 가격 범위(`minPrice`·`maxPrice`), AI 상담 응답의 지역(`area`) 전달                                                                 | #20   |
| ai       | `fix/launch-hardening`         | dev                        | LLM 시간 제한·재시도, 심평원 캐시·요청 간격, non-root, 422 입력 미노출                                                                              | #3    |
| ai       | `feature/ai-area`              | `fix/launch-hardening`     | 사용자가 말한 장소를 좌표·시군구로 찾아 `area`로 전달(아래 설명)                                                                                    | #4    |

- backend는 #14 → #15(V3) → #16(V4) → #18(V5) → #19 순서로 합친다. #17과 #20은 #14 뒤 아무 때나 합친다.
- backend의 겹친 PR(#15~#20)은 기준이 dev·main이 아니라 CI가 돌지 않는다. 로컬에서 테스트를 돌려 확인했다. 아래 PR을 합쳐 기준이 dev로 바뀌면 CI가 돈다.
- ai는 #3 → #4, frontend는 #2 → `feature/design-upgrade` 순서로 합친다. frontend #3(리브랜딩)은 합치지 않는다.
- frontend의 권리침해 신고 화면(`/hospitals/[ykiho]/review/[reviewId]/claim`, 내 후기의 임시조치·재게시 요청, `/admin/claims`)은 이 API가 없으면(404) 입구를 숨기거나 "아직 서버에 없음"으로 보여 준다.
- ai `feature/ai-area`(`fix/launch-hardening` 기준)는 사용자가 말한 장소를 네이버 지역 검색(NAVER API HUB)으로 좌표·주소를 찾고 주소로 DB의 시도·시군구를 맞춰 `area`(좌표 포함)로 돌려준다. 네이버를 쓸 수 없을 때만 AI 추정으로 구까지 맞춘다. 프론트는 좌표가 있으면 PostGIS 반경 검색으로 주변 병원을 가까운 순으로 보여 준다. 또 병원을 골라 달라거나 평점 순위를 물으면 하지 않는다고 고지한다. backend `feature/price-band-ai-area`와 함께 합친다.
- ai의 열린 PR 두 개(`feature/ai-tuning`, `feature/runyour-llm`)는 합치지 않았다. 합칠 때 확인할 것:
  - `metered.py`의 `UsageLog`가 운영에서 끝없이 쌓인다.
  - `openai_compat.py`는 시간 제한이 60초다.
  - `gemini.py`, `factory.py`, `main.py`가 `fix/launch-hardening`과 충돌한다.

## 2. DB

- 마이그레이션 파일만 추가했고 어느 DB에도 적용하지 않았다.
  - `V3__create_ai_quota_usage.sql`
  - `V4__privacy_consent.sql`
  - `V5__review_claims.sql`(`review.status`에 `TEMPORARILY_HIDDEN`·`DELETED` 추가, `review_claim` 테이블)
- Flyway는 `FLYWAY_ENABLED=false`가 기본이다. 켜는 절차는 backend `docs/operations.md`에 있다(백업 → V1·V2 확인 → dev → prod).

## 3. 새 환경변수

- **frontend**
  - `NEXT_PUBLIC_SITE_URL`: 운영 빌드에 필수. 로컬 `pnpm build`에도 필요하다. Vercel 미리보기에서 비어 있으면 `VERCEL_BRANCH_URL`을 쓴다.
  - `BFF_SHARED_SECRET`: Vercel production에서 필수.
  - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
  - Vercel에 넣어 둔 값(2026-11-19)
    - Production: `NEXT_PUBLIC_API_URL=https://prod.mediprice.app`, `NEXT_PUBLIC_SITE_URL=https://mediprice.app`, `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
    - Preview: `NEXT_PUBLIC_API_URL=https://dev.mediprice.app`, `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
    - 아직 없음: Production `BFF_SHARED_SECRET`(비밀값이라 운영자가 넣는다. 없으면 운영 빌드가 실패한다).
- **backend**
  - prod에서 비면 서버가 뜨지 않는다: `BFF_SHARED_SECRET`(프론트와 같은 값), `AI_SERVICE_TOKEN`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `OAUTH2_REDIRECT_URI`, `CORS_ALLOWED_ORIGINS`.
  - 선택: `FLYWAY_ENABLED`, `AI_QUOTA_STORE`(memory|jdbc), `AI_GLOBAL_DAILY_CAP`, `APP_RATELIMIT_*`, `CONSENT_*_VERSION`.
  - `CONSENT_*_VERSION`은 프론트 `src/config/legal.ts`의 `LEGAL_DOCUMENT_VERSIONS`와 같아야 한다. 다르면 동의 저장이 모두 409가 된다.
  - `CLAIMS_PRIVACY_NOTICE_VERSION`: 권리침해 신고 화면의 개인정보 수집·이용 안내문 버전. 프론트 `src/config/legal.ts`의 `CLAIM_PRIVACY_NOTICE_VERSION`(지금 `2026-11-19`)과 같아야 한다. 비어 있으면 접수가 503이고, 값이 다르면 프론트가 양식을 막는다("지금은 온라인 접수를 받을 수 없어요"). 안내문(`claims.notice`)을 고치면 양쪽을 함께 올린다.
  - 선택: `CLAIMS_RATE_LIMIT_*`, `CLAIMS_EXPIRY_*`, `RETENTION_*`(backend `docs/operations.md` 6·7장).
- **ai**: `NAVER_API_HUB_CLIENT_ID`·`NAVER_API_HUB_CLIENT_SECRET`(NCP NAVER API HUB에서 지역 검색 API를 고른 앱의 키. 없으면 장소를 좌표로 찾지 못함), `LLM_TIMEOUT_SECONDS`, `LLM_ATTEMPT_TIMEOUT_SECONDS`, `TURN_TIMEOUT_SECONDS`. 운영에서는 `ENABLE_DOCS`·`ENABLE_DEMO`를 끈다.

## 4. 운영자가 정해야 할 것

1. **운영 주체 정보**: 이름(법인·개인), 주소, 연락처, 사업자등록 여부, 개인정보 보호책임자. `src/config/legal-facts.json`에 넣고 `pnpm launch:check`로 확인한다.
2. **위탁·국외 이전**
   - 운영 DB 지역: dev는 Neon us-east-2.
   - LLM 제공자: RunYour 게이트웨이 또는 Gemini 직접. 유료 등급 여부와 학습 이용 여부. 무료 Gemini는 입력이 학습·사람 검토에 쓰일 수 있다.
   - 호스팅 업체와 지역.
3. **보유기간**: 접속기록, 백업, 조회 기록, 신고 기록, 권리침해 신고(신청인 이름·이메일 포함). 탈퇴 시 후기는 삭제와 익명으로 남김 중 하나를 고른다. 지금은 익명으로 남기고, 안내 문구도 그렇게 고쳐 두었다.
   - 정한 값은 프론트 `legal-facts.json`(`retention.rightsClaimDays` 등)과 backend `RETENTION_*_DAYS`에 같이 넣는다. 값이 없으면 backend 자동 삭제 작업은 그 데이터를 지우지 않는다(꺼진 상태).
4. **최소 나이**: 지금은 만 14세 확인을 받는다.
5. **동의를 거부했을 때**: 지금은 로그아웃만 한다. Google 로그인 때 만들어진 계정이 남으므로, 첫 동의를 거부하면 계정을 지울지 정한다.
6. **위치**: 서버에는 약 1km로 흐린 좌표를 로그인 정보 없이 보내도록 바꿨다. 이 구조로 위치기반서비스사업 신고 대상에서 빠지는지 법률 검토가 필요하다.
   - AI 상담에서 사용자가 말한 장소 이름(예: "응암역")은 네이버(NCP NAVER API HUB 지역 검색)로 보낸다. 대화 내용·계정·IP는 보내지 않는다. 처리방침의 위탁·제공 항목에 넣을지 정한다.
7. **법률 검토**: 처리방침·이용약관·후기 운영정책 최종본. 약관 변경 동의 간주 조항, 처리 기한(10일) 같은 약속이 실제 운영 절차와 맞는지 본다.
8. **도메인과 모니터링**
   - 운영 도메인: canonical, CORS, OAuth, 네이버 지도 허용 URL, HSTS.
   - 오류 추적·분석 도구: Sentry, Vercel 등. 분석 도구를 넣으면 처리방침과 쿠키 안내도 고친다.
9. **AI 비용**: `AI_GLOBAL_DAILY_CAP` 값, `AI_QUOTA_STORE=jdbc` 전환 시점.
10. **CSP**: 운영 https에서 report-only로 지켜본 뒤 강제로 바꾼다.

## 5. 아직 하지 않은 것

- 세 저장소 모두 오류 추적과 모니터링(도구 결정 후).
- 권리침해 신고의 처리 결과 통지는 수동이다. 메일 발송 업체가 없어 운영자가 직접 알리고 `/admin/claims`에서 알린 사실만 기록한다. 임시조치 직후에도 알릴지, 무엇을 알릴지는 법률 검토로 정한다.
- 보유기간 배치 삭제(`feature/retention-jobs`)는 만들었지만 기간은 운영자가 정할 값이라 비어 있고, 그동안 아무것도 지우지 않는다. 관리자 접속 기록은 365일 미만으로 정할 수 없다.
- 내 데이터 내려받기(`/api/users/me/export`)에 권리침해 신고(직접 낸 신고, 내 후기에 들어온 임시조치·재게시 요청)가 아직 들어 있지 않다(backend).
- 쓰지 않는 `ai_conversation`·`receipt` 테이블 정리 또는 보유기간 정의.

## 6. 배포 확인 사항 (2026-11-19)

- `https://prod.mediprice.app`이 502를 돌려준다. 운영 backend가 떠 있는지 확인한다.
- Vercel 미리보기 주소는 배포마다 달라 로그인이 되지 않는다. 미리보기 로그인이 필요하면 고정 주소 하나를 정해 dev backend의 `CORS_ALLOWED_ORIGINS`와 `OAUTH2_ALLOWED_REDIRECT_ORIGINS`에 넣는다(와일드카드 안 됨).
- NCP Maps 콘솔의 Web 서비스 URL에 `https://mediprice.app`(필요하면 미리보기 주소)을 넣는다.
