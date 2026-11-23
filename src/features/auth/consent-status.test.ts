import { describe, expect, it } from 'vitest';

import type { ConsentStatus } from './consent-api';
import {
  isLocationConsentActive,
  withLocationWithdrawn,
} from './consent-status';

function statusWith(
  location?: Partial<ConsentStatus['consents'][number]>,
): ConsentStatus {
  return {
    requiredConsentsMissing: false,
    consents: location
      ? [
          {
            type: 'LOCATION',
            required: false,
            currentVersion: '2026-11-23',
            agreed: false,
            agreedVersion: null,
            agreedAt: null,
            withdrawnAt: null,
            reconsentRequired: false,
            ...location,
          },
        ]
      : [],
  };
}

describe('isLocationConsentActive', () => {
  it.each([
    ['상태를 아직 모르면', undefined, false],
    ['LOCATION 항목이 없으면', statusWith(), false],
    ['동의하지 않았으면', statusWith({ agreed: false }), false],
    [
      '재동의가 필요하면',
      statusWith({ agreed: true, reconsentRequired: true }),
      false,
    ],
    [
      '현재 버전에 동의했으면',
      statusWith({ agreed: true, reconsentRequired: false }),
      true,
    ],
  ])('%s %s', (_name, status, expected) => {
    expect(isLocationConsentActive(status)).toBe(expected);
  });
});

describe('withLocationWithdrawn', () => {
  it('위치 동의만 끄고 다른 항목은 그대로 둔다', () => {
    const status = statusWith({ agreed: true, agreedVersion: '2026-11-23' });
    const privacy = { ...status.consents[0]!, type: 'PRIVACY', required: true };
    const withdrawn = withLocationWithdrawn({
      ...status,
      consents: [privacy, ...status.consents],
    });

    expect(withdrawn.consents).toEqual([
      privacy,
      { ...status.consents[0], agreed: false },
    ]);
    expect(isLocationConsentActive(withdrawn)).toBe(false);
  });
});
