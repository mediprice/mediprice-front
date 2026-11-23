import { describe, expect, it } from 'vitest';

import { locationAccess, shouldLocateOnEntry } from './location-access';

describe('locationAccess', () => {
  it('비로그인이면 동의 값과 무관하게 signedOut', () => {
    expect(locationAccess({ isSignedIn: false, isConsentActive: true })).toBe(
      'signedOut',
    );
    expect(locationAccess({ isSignedIn: false, isConsentActive: false })).toBe(
      'signedOut',
    );
  });

  it('로그인했지만 동의가 없으면 needsConsent', () => {
    expect(locationAccess({ isSignedIn: true, isConsentActive: false })).toBe(
      'needsConsent',
    );
  });

  it('로그인하고 동의도 있으면 ready', () => {
    expect(locationAccess({ isSignedIn: true, isConsentActive: true })).toBe(
      'ready',
    );
  });
});

describe('shouldLocateOnEntry', () => {
  it('준비되지 않았거나 권한이 허용되지 않으면 위치를 읽지 않는다', () => {
    expect(
      shouldLocateOnEntry({ access: 'signedOut', permission: 'granted' }),
    ).toBe(false);
    expect(
      shouldLocateOnEntry({ access: 'needsConsent', permission: 'granted' }),
    ).toBe(false);
    expect(shouldLocateOnEntry({ access: 'ready', permission: 'prompt' })).toBe(
      false,
    );
  });

  it('준비되고 권한이 허용됐을 때만 위치를 읽는다', () => {
    expect(
      shouldLocateOnEntry({ access: 'ready', permission: 'granted' }),
    ).toBe(true);
  });
});
