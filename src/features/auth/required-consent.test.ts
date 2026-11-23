import { describe, expect, it } from 'vitest';

import { LEGAL_DOCUMENT_VERSIONS } from '@/config/legal';

import type { ConsentStatus } from './consent-api';
import {
  checkAllConsents,
  consentHref,
  consentReturnPath,
  firstUncheckedConsent,
  hasNewerDocuments,
  isConsentExemptPath,
  isReconsent,
  needsRequiredConsent,
  requiredConsentDecisions,
} from './required-consent';

const state = (
  type: string,
  overrides: Partial<ConsentStatus['consents'][number]> = {},
) => ({
  type,
  required: type !== 'MEDICAL_PROFILE',
  currentVersion: '2026-11-19',
  agreed: false,
  agreedVersion: null,
  agreedAt: null,
  withdrawnAt: null,
  reconsentRequired: false,
  ...overrides,
});

const status = (consents: ConsentStatus['consents']): ConsentStatus => ({
  requiredConsentsMissing: true,
  consents,
});

describe('needsRequiredConsent', () => {
  it('requiredConsentsMissing가 true일 때만 동의 화면이 필요하다', () => {
    expect(needsRequiredConsent({ id: 1, requiredConsentsMissing: true })).toBe(
      true,
    );
    expect(
      needsRequiredConsent({ id: 1, requiredConsentsMissing: false }),
    ).toBe(false);
  });

  it('값이 없는 예전 백엔드 응답이나 이상한 값이면 막지 않는다', () => {
    expect(needsRequiredConsent({ id: 1 })).toBe(false);
    expect(
      needsRequiredConsent({ id: 1, requiredConsentsMissing: 'yes' }),
    ).toBe(false);
    expect(needsRequiredConsent(null)).toBe(false);
  });
});

describe('consentHref · consentReturnPath', () => {
  it('돌아갈 경로를 인코딩해 붙이고, 홈이면 뺀다', () => {
    expect(consentHref('/items/A?region=all')).toBe(
      '/consent?returnTo=%2Fitems%2FA%3Fregion%3Dall',
    );
    expect(consentHref('/')).toBe('/consent');
    expect(consentHref(null)).toBe('/consent');
  });

  it('다른 출처·동의 화면 자신은 홈으로 바꾼다', () => {
    expect(consentReturnPath('https://evil.test/')).toBe('/');
    expect(consentReturnPath('//evil.test')).toBe('/');
    expect(consentReturnPath('/consent?returnTo=%2F')).toBe('/');
    expect(consentReturnPath('/my/account')).toBe('/my/account');
  });
});

describe('isConsentExemptPath', () => {
  it('동의 화면과 동의할 문서는 막지 않는다', () => {
    expect(isConsentExemptPath('/consent')).toBe(true);
    expect(isConsentExemptPath('/terms')).toBe(true);
    expect(isConsentExemptPath('/privacy')).toBe(true);
    expect(isConsentExemptPath('/location-terms')).toBe(true);
    expect(isConsentExemptPath('/policy/reviews')).toBe(true);
  });

  it('그 밖의 화면은 막는다', () => {
    expect(isConsentExemptPath('/')).toBe(false);
    expect(isConsentExemptPath('/my/account')).toBe(false);
    expect(isConsentExemptPath('/privacy-other')).toBe(false);
  });
});

describe('requiredConsentDecisions', () => {
  it('필수 세 항목을 화면 문서의 버전으로 동의한다', () => {
    expect(requiredConsentDecisions()).toEqual([
      { type: 'TERMS', version: LEGAL_DOCUMENT_VERSIONS.TERMS, agreed: true },
      {
        type: 'PRIVACY',
        version: LEGAL_DOCUMENT_VERSIONS.PRIVACY,
        agreed: true,
      },
      { type: 'AGE_14', version: LEGAL_DOCUMENT_VERSIONS.AGE_14, agreed: true },
    ]);
  });
});

describe('hasNewerDocuments · isReconsent', () => {
  it('서버의 필수 문서 버전이 화면과 다르면 새 문서가 있다', () => {
    expect(
      hasNewerDocuments(
        status([state('TERMS', { currentVersion: '2027-01-01' })]),
      ),
    ).toBe(true);
    expect(hasNewerDocuments(status([state('TERMS'), state('AGE_14')]))).toBe(
      false,
    );
  });

  it('선택 항목의 버전 차이는 필수 동의 화면과 상관없다', () => {
    expect(
      hasNewerDocuments(
        status([state('MEDICAL_PROFILE', { currentVersion: '2027-01-01' })]),
      ),
    ).toBe(false);
  });

  it('이전 버전에만 동의한 필수 항목이 있으면 다시 묻는 경우다', () => {
    expect(
      isReconsent(status([state('TERMS', { reconsentRequired: true })])),
    ).toBe(true);
    expect(isReconsent(status([state('TERMS')]))).toBe(false);
    expect(isReconsent(undefined)).toBe(false);
  });
});

describe('checkAllConsents · firstUncheckedConsent', () => {
  it('모두 동의는 세 항목을 한꺼번에 켜고 끈다', () => {
    expect(checkAllConsents(true)).toEqual({
      TERMS: true,
      PRIVACY: true,
      AGE_14: true,
    });
    expect(firstUncheckedConsent(checkAllConsents(true))).toBe(null);
  });

  it('빠진 항목 중 화면에서 첫 번째를 고른다', () => {
    expect(
      firstUncheckedConsent({ TERMS: true, PRIVACY: false, AGE_14: false }),
    ).toBe('PRIVACY');
    expect(firstUncheckedConsent(checkAllConsents(false))).toBe('TERMS');
  });
});
