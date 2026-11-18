# 법적 고지 출시 체크리스트

`/terms`(이용약관), `/privacy`(개인정보 처리방침), `/policy/reviews`(후기 운영정책)의 문구는 `src/i18n/messages/ko/legal.json`에, 운영자가 정할 사실 값은 `src/config/legal-facts.json`에 있다. 문서 버전은 `src/config/legal.ts`의 `LEGAL_DOCUMENT_VERSIONS`이며 백엔드 동의 기록과 같은 키(`TERMS`, `PRIVACY`, `REVIEW_POLICY`, `MEDICAL_PROFILE`)를 쓴다.

## 출시 전에 할 일

1. **법률 검토(필수)**: 지금 문구는 구현된 기능을 바탕으로 쓴 초안이다. 출시 전에 개인정보·의료광고·약관 규제에 익숙한 전문가의 검토를 받는다. 이 안내는 사용자 화면에 보이지 않는다.
2. `legal-facts.json`의 `null`을 모두 채운다. `null`인 값은 화면에 "운영자 확정 필요"로 보이고(푸터는 줄째 숨김), `pnpm launch:check`가 실패한다.
   - 해당 없는 값(사업자등록번호, 전화, 대표자, 보호책임자 직책)은 `false`로 둔다.
   - `processors`는 실제로 쓰는 업체만 남긴다(`task`: `database` `webHosting` `apiHosting` `llmGateway` `llmModel`). `countries`가 `KR`뿐이면 국외 이전 표에서 빠진다.
   - `retention.reviewOnWithdrawal`: 백엔드는 지금 탈퇴해도 후기를 남기고 작성자만 비운다(`anonymize`). 마이페이지 탈퇴 안내 문구와 맞춘다.
3. `pnpm launch:check`가 통과하는지 확인한다.
4. 문서를 고치면 `LEGAL_DOCUMENT_VERSIONS`의 날짜와 시행일을 올리고, 개인정보 처리방침의 변경 이력 표(`src/app/(shell)/(sub)/privacy/_components/closing-sections.tsx`)에 줄을 더한다. 백엔드 `app.consent.versions.*`도 같은 값으로 올린다. 다르면 동의 저장이 409(`CONSENT_VERSION_OUTDATED`)로 실패하고, 동의 화면은 새로고침을 권한다.

## 동의와 고지가 보이는 곳

- **필수 동의**(`/consent`, `features/auth/components/required-consent-form.tsx`): 첫 로그인 뒤와 `/users/me`의 `requiredConsentsMissing`이 true일 때. 이용약관, 개인정보 수집·이용(항목·목적·보유 기간 표와 거부 권리), 만 `minimumAge`세 이상(`null`이면 14세로 묻는다). 표의 문구는 `auth.consent.summary`에 있어 처리방침 2·3항과 함께 고친다.
- **건강 정보 동의**(`/my/medical-profile`): 목적·항목·보유 기간·거부 권리와 불이익. 목적 문장은 `ai.medicalProfileSentToProvider`를 따른다.
- **AI 찾기 안내**(첫 전송·첫 음성 입력 전): 외부 AI 업체는 `processors`의 `llmGateway`·`llmModel`, 학습 이용은 `ai.providerTrainingUse`. 이 값이나 안내 문구를 바꾸면 `features/ai/ai-notice.ts`의 `AI_NOTICE_VERSION`을 올려 다시 보이게 한다.
- **현재 위치**: 서버에는 약 1km로 흐린 좌표만 로그인 없이 보낸다(`docs/coding-convention.md` 13.5).
