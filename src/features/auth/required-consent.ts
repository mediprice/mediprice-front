import { LEGAL_DOCUMENT_VERSIONS, LEGAL_FACTS } from '@/config/legal';

import type { ConsentDecision, ConsentStatus } from './consent-api';
import { sanitizeReturnPath } from './return-path';

export const CONSENT_PATH = '/consent' as const;

/** 가입할 때 받는 필수 동의. 순서대로 화면에 보인다. */
export const REQUIRED_CONSENTS = ['TERMS', 'PRIVACY', 'AGE_14'] as const;
export type RequiredConsent = (typeof REQUIRED_CONSENTS)[number];

/** 운영자가 최소 나이를 정하지 않았으면(legal-facts.json의 null) 법정 기준인 14세로 묻는다. `pnpm launch:check`가 null을 막는다. */
export const MINIMUM_AGE = LEGAL_FACTS.minimumAge ?? 14;

/** 동의 화면이 떠 있어도 새 탭으로 열어 읽을 수 있어야 하는 문서. */
const READABLE_PATHS = [
  '/terms',
  '/privacy',
  '/location-terms',
  '/policy/reviews',
];

/**
 * /api/users/me의 requiredConsentsMissing. 아직 배포되지 않은 백엔드에는 이 값이 없으므로 그때는 막지 않는다(false).
 * 생성 타입에 없는 값이라 unknown으로 받아 좁힌다.
 */
export function needsRequiredConsent(user: unknown) {
  return (
    typeof user === 'object' &&
    user !== null &&
    'requiredConsentsMissing' in user &&
    user.requiredConsentsMissing === true
  );
}

/** 동의 화면 주소. 돌아갈 경로는 동의를 마친 뒤 이동할 곳이다. */
export function consentHref(
  returnTo: string | null,
): typeof CONSENT_PATH | `${typeof CONSENT_PATH}?returnTo=${string}` {
  const safe = consentReturnPath(returnTo);
  return safe === '/'
    ? CONSENT_PATH
    : `${CONSENT_PATH}?returnTo=${encodeURIComponent(safe)}`;
}

/** 같은 출처의 안전한 경로만 받는다. 동의 화면 자신이면 반복되므로 홈이다. */
export function consentReturnPath(value: unknown) {
  const safe = sanitizeReturnPath(value);
  if (!safe) return '/';
  const pathname = safe.split('?')[0] ?? '';
  return pathname === CONSENT_PATH ? '/' : safe;
}

/** 동의 화면으로 보내지 않을 화면(동의 화면 자신과 동의할 문서). */
export function isConsentExemptPath(pathname: string) {
  return (
    pathname === CONSENT_PATH ||
    READABLE_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  );
}

/** 화면에 보여 준 문서의 버전으로 필수 항목에 모두 동의한다. */
export function requiredConsentDecisions(): ConsentDecision[] {
  return REQUIRED_CONSENTS.map((type) => ({
    type,
    version: LEGAL_DOCUMENT_VERSIONS[type],
    agreed: true,
  }));
}

function isRequiredConsent(type: string): type is RequiredConsent {
  return REQUIRED_CONSENTS.some((required) => required === type);
}

/** 서버의 현재 버전이 이 화면이 가진 문서와 다르면(새 배포 전) 다시 보내도 409가 나므로 새로고침을 권한다. */
export function hasNewerDocuments(status: ConsentStatus) {
  return status.consents.some(
    ({ type, currentVersion }) =>
      isRequiredConsent(type) &&
      currentVersion !== LEGAL_DOCUMENT_VERSIONS[type],
  );
}

/** 이전 버전에만 동의해 다시 묻는 경우(약관 변경). 처음 가입이면 false다. */
export function isReconsent(status: ConsentStatus | undefined) {
  return (
    status?.consents.some(
      (consent) => consent.required && consent.reconsentRequired,
    ) ?? false
  );
}

export type ConsentChecks = Record<RequiredConsent, boolean>;

/** "모두 동의"는 각 항목을 한꺼번에 바꿀 뿐이고, 항목은 늘 따로 보이고 따로 끌 수 있다. */
export function checkAllConsents(value: boolean): ConsentChecks {
  return { TERMS: value, PRIVACY: value, AGE_14: value };
}

export function firstUncheckedConsent(checks: ConsentChecks) {
  return REQUIRED_CONSENTS.find((type) => !checks[type]) ?? null;
}
