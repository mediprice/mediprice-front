import { describe, expect, it } from 'vitest';

import {
  locationAccess,
  locationEntryStep,
  shouldLocateOnEntry,
} from './location-access';

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

describe('locationEntryStep', () => {
  it('권한 상태를 읽는 중이면 기다린다', () => {
    expect(locationEntryStep({ access: 'ready', permission: 'checking' })).toBe(
      'wait',
    );
  });

  it('권한이 허용됐어도 로그인·동의 상태를 모르면 기다린다', () => {
    expect(locationEntryStep({ access: null, permission: 'granted' })).toBe(
      'wait',
    );
  });

  it('권한이 허용됐어도 로그인하지 않았거나 동의가 없으면 위치를 읽지 않는다', () => {
    expect(
      locationEntryStep({ access: 'signedOut', permission: 'granted' }),
    ).toBe('fallback');
    expect(
      locationEntryStep({ access: 'needsConsent', permission: 'granted' }),
    ).toBe('fallback');
  });

  it('로그인·동의가 있고 권한이 허용됐을 때만 바로 위치를 읽는다', () => {
    expect(locationEntryStep({ access: 'ready', permission: 'granted' })).toBe(
      'locate',
    );
  });

  it('권한을 아직 묻지 않았으면 로그인·동의 상태를 기다리지 않고 지역 기준으로 보여 준다', () => {
    expect(locationEntryStep({ access: null, permission: 'prompt' })).toBe(
      'fallback',
    );
    expect(
      locationEntryStep({ access: 'ready', permission: 'unsupported' }),
    ).toBe('fallback');
  });

  it('권한이 거부됐으면 denied 안내', () => {
    expect(locationEntryStep({ access: null, permission: 'denied' })).toBe(
      'denied',
    );
    expect(locationEntryStep({ access: 'ready', permission: 'denied' })).toBe(
      'denied',
    );
  });
});
