# 출시 준비 현황 (2026-11-20)

실제 출시를 기준으로 저장소 세 곳(frontend, backend, ai)에서 한 작업과 남은 결정을 모은 문서다. 법률 문서의 확정 정보는 [legal-launch-checklist.md](./legal-launch-checklist.md)를 따른다.

## 1. 브랜치와 합치는 순서

| 저장소   | 브랜치                         | 기준                       | 내용                                                                                                                | push  |
| -------- | ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----- |
| frontend | `feature/ui-conventions`       | dev                        | 1차본(컨벤션, 화면 전체, BFF)                                                                                       | 됨    |
| frontend | `feature/redesign-big-numbers` | `feature/ui-conventions`   | 큰 숫자 리디자인, 가격 정직성, 법률 문서·동의, SSR, 출시 기반                                                       | 안 됨 |
| backend  | `fix/frontend-integration`     | dev                        | 프론트 연동(리다이렉트, CORS, AI 프록시, 다중 시도)                                                                 | 됨    |
| backend  | `feature/launch-hardening`     | `fix/frontend-integration` | Flyway(기본 꺼짐), health, AI 한도 DB 저장·전체 상한, IP 속도 제한, prod 필수값 검사, 세션 쿠키, AI 로그·state 검증 | 안 됨 |
| backend  | `feature/privacy-consent`      | `fix/frontend-integration` | 동의 기록(V4), 의료 정보 별도 동의, 관리자 접속 기록, 내 데이터 내려받기                                            | 안 됨 |
| ai       | `fix/launch-hardening`         | main                       | LLM 시간 제한·재시도, 심평원 캐시·요청 간격, non-root, 422 입력 미노출                                              | 안 됨 |

- backend는 `feature/launch-hardening`(V3)을 먼저, `feature/privacy-consent`(V4)를 다음에 합친다.
- backend 작업 폴더는 git worktree로 나뉘어 있다: `../mediprice-backend-hardening`, `../mediprice-backend-privacy`, `../mediprice-ai-hardening`.
- ai의 열린 PR 두 개(`feature/ai-tuning`, `feature/runyour-llm`)는 합치지 않았다. 합칠 때 확인할 것:
  - `metered.py`의 `UsageLog`가 운영에서 끝없이 쌓인다.
  - `openai_compat.py`는 시간 제한이 60초다.
  - `gemini.py`, `factory.py`, `main.py`가 `fix/launch-hardening`과 충돌한다.

## 2. DB

- 마이그레이션 파일만 추가했고 어느 DB에도 적용하지 않았다.
  - `V3__create_ai_quota_usage.sql`
  - `V4__privacy_consent.sql`
- Flyway는 `FLYWAY_ENABLED=false`가 기본이다. 켜는 절차는 backend `docs/operations.md`에 있다(백업 → V1·V2 확인 → dev → prod).

## 3. 새 환경변수

- **frontend**
  - `NEXT_PUBLIC_SITE_URL`: 운영 빌드에 필수. 로컬 `pnpm build`에도 필요하다.
  - `BFF_SHARED_SECRET`: Vercel production에서 필수.
  - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
- **backend**
  - prod에서 비면 서버가 뜨지 않는다: `BFF_SHARED_SECRET`(프론트와 같은 값), `AI_SERVICE_TOKEN`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `OAUTH2_REDIRECT_URI`, `CORS_ALLOWED_ORIGINS`.
  - 선택: `FLYWAY_ENABLED`, `AI_QUOTA_STORE`(memory|jdbc), `AI_GLOBAL_DAILY_CAP`, `APP_RATELIMIT_*`, `CONSENT_*_VERSION`.
  - `CONSENT_*_VERSION`은 프론트 `src/config/legal.ts`의 `LEGAL_DOCUMENT_VERSIONS`와 같아야 한다. 다르면 동의 저장이 모두 409가 된다.
- **ai**: `LLM_TIMEOUT_SECONDS`, `LLM_ATTEMPT_TIMEOUT_SECONDS`, `TURN_TIMEOUT_SECONDS`. 운영에서는 `ENABLE_DOCS`·`ENABLE_DEMO`를 끈다.

## 4. 운영자가 정해야 할 것

1. **운영 주체 정보**: 이름(법인·개인), 주소, 연락처, 사업자등록 여부, 개인정보 보호책임자. `src/config/legal-facts.json`에 넣고 `pnpm launch:check`로 확인한다.
2. **위탁·국외 이전**
   - 운영 DB 지역: dev는 Neon us-east-2.
   - LLM 제공자: RunYour 게이트웨이 또는 Gemini 직접. 유료 등급 여부와 학습 이용 여부. 무료 Gemini는 입력이 학습·사람 검토에 쓰일 수 있다.
   - 호스팅 업체와 지역.
3. **보유기간**: 접속기록, 백업, 조회 기록, 신고 기록. 탈퇴 시 후기는 삭제와 익명으로 남김 중 하나를 고른다. 지금은 익명으로 남기고, 안내 문구도 그렇게 고쳐 두었다.
4. **최소 나이**: 지금은 만 14세 확인을 받는다.
5. **동의를 거부했을 때**: 지금은 로그아웃만 한다. Google 로그인 때 만들어진 계정이 남으므로, 첫 동의를 거부하면 계정을 지울지 정한다.
6. **위치**: 서버에는 약 1km로 흐린 좌표를 로그인 정보 없이 보내도록 바꿨다. 이 구조로 위치기반서비스사업 신고 대상에서 빠지는지 법률 검토가 필요하다.
7. **법률 검토**: 처리방침·이용약관·후기 운영정책 최종본. 약관 변경 동의 간주 조항, 처리 기한(10일) 같은 약속이 실제 운영 절차와 맞는지 본다.
8. **도메인과 모니터링**
   - 운영 도메인: canonical, CORS, OAuth, 네이버 지도 허용 URL, HSTS.
   - 오류 추적·분석 도구: Sentry, Vercel 등. 분석 도구를 넣으면 처리방침과 쿠키 안내도 고친다.
9. **AI 비용**: `AI_GLOBAL_DAILY_CAP` 값, `AI_QUOTA_STORE=jdbc` 전환 시점.
10. **CSP**: 운영 https에서 report-only로 지켜본 뒤 강제로 바꾼다.

## 5. 아직 하지 않은 것

- 세 저장소 모두 오류 추적과 모니터링(도구 결정 후).
- 후기 권리침해 신고(비회원·병원 포함)와 임시조치(30일) 처리 흐름, 처리 결과 통지.
- 조회 기록·신고 기록 보유기간 배치 삭제, 관리자 접속 기록 2년 보관 정리.
- 쓰지 않는 `ai_conversation`·`receipt` 테이블 정리 또는 보유기간 정의.
- 병원 목록 API(사이트맵에 병원 페이지 넣기), 전체 통계·인기 순위 API(홈).
