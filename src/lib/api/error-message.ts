import type { Messages } from 'next-intl';

import { ApiError, NetworkError } from './errors';

type ErrorMessages = Messages['errors'];

/** errors.page.*(에러 화면 문구) 같은 묶음은 빼고 문자열 키만 고른다. */
export type ErrorMessageKey = {
  [K in keyof ErrorMessages]: ErrorMessages[K] extends string ? K : never;
}[keyof ErrorMessages];

/** 백엔드 message는 한국어 고정이고 fieldErrors.reason은 Bean Validation 기본 문구라서 화면 문구는 코드로만 고른다. */
const MESSAGE_KEY_BY_CODE = {
  INVALID_INPUT: 'invalidInput',
  METHOD_NOT_ALLOWED: 'badRequest',
  UNAUTHORIZED: 'loginRequired',
  INVALID_ACCESS_TOKEN: 'sessionExpired',
  EXPIRED_ACCESS_TOKEN: 'sessionExpired',
  INVALID_REFRESH_TOKEN: 'sessionExpired',
  EXPIRED_REFRESH_TOKEN: 'sessionExpired',
  USER_NOT_FOUND: 'sessionExpired',
  OAUTH2_LOGIN_FAILED: 'loginFailed',
  MISSING_TOKENS: 'loginFailed',
  INVALID_EXPIRES_IN: 'loginFailed',
  OAUTH2_EMAIL_NOT_VERIFIED: 'oauthEmailNotVerified',
  OAUTH2_EMAIL_ALREADY_REGISTERED: 'oauthEmailAlreadyRegistered',
  ACCESS_DENIED: 'forbidden',
  REVIEW_FORBIDDEN: 'forbidden',
  CANNOT_REPORT_OWN_REVIEW: 'cannotReportOwnReview',
  RESOURCE_NOT_FOUND: 'notFound',
  NOT_FOUND: 'notFound',
  MEDICAL_PROFILE_NOT_FOUND: 'notFound',
  MEDICAL_PROFILE_CONSENT_REQUIRED: 'medicalProfileConsentRequired',
  CONSENT_VERSION_OUTDATED: 'consentVersionOutdated',
  CONSENT_WITHDRAWAL_NOT_ALLOWED: 'consentWithdrawalNotAllowed',
  HOSPITAL_NOT_FOUND: 'hospitalNotFound',
  NPAY_ITEM_NOT_FOUND: 'npayItemNotFound',
  SIDO_NOT_FOUND: 'regionNotFound',
  REVIEW_NOT_FOUND: 'reviewNotFound',
  REPORT_NOT_FOUND: 'reportNotFound',
  HISTORY_NOT_FOUND: 'historyNotFound',
  REVIEW_ALREADY_REPORTED: 'reviewAlreadyReported',
  REPORT_ALREADY_RESOLVED: 'reportAlreadyResolved',
  RATE_LIMITED: 'tooManyRequests',
  AI_QUOTA_EXCEEDED: 'aiQuotaExceeded',
  AI_UNAVAILABLE: 'aiUnavailable',
  AI_AUDIO_TOO_LARGE: 'audioTooLarge',
  UNSUPPORTED_MEDIA_TYPE: 'unsupportedMedia',
  INTERNAL_ERROR: 'server',
  UPSTREAM_UNAVAILABLE: 'serverUnavailable',
} as const satisfies Record<string, ErrorMessageKey>;

type KnownErrorCode = keyof typeof MESSAGE_KEY_BY_CODE;

function isKnownErrorCode(code: string): code is KnownErrorCode {
  return Object.hasOwn(MESSAGE_KEY_BY_CODE, code);
}

function messageKeyByStatus(status: number): ErrorMessageKey {
  if (status === 400 || status === 405 || status === 415) return 'badRequest';
  if (status === 401) return 'loginRequired';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'tooManyRequests';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** ApiError·NetworkError·에러 코드 문자열(OAuth 콜백)을 errors 네임스페이스의 키로 바꾼다. */
export function errorMessageKey(error: unknown): ErrorMessageKey {
  if (error instanceof NetworkError) return 'network';
  if (error instanceof ApiError) {
    return isKnownErrorCode(error.code)
      ? MESSAGE_KEY_BY_CODE[error.code]
      : messageKeyByStatus(error.status);
  }
  if (typeof error === 'string' && isKnownErrorCode(error)) {
    return MESSAGE_KEY_BY_CODE[error];
  }
  return 'unknown';
}
