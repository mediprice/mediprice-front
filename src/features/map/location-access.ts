import type { LocationPermission } from '@/features/map/geolocation';

export type LocationAccess = 'signedOut' | 'needsConsent' | 'ready';

/** 로그인 여부와 현재 위치 사용 동의 상태로 위치 기능을 쓸 수 있는지 가른다. */
export function locationAccess(input: {
  isSignedIn: boolean;
  isConsentActive: boolean;
}): LocationAccess {
  if (!input.isSignedIn) return 'signedOut';
  return input.isConsentActive ? 'ready' : 'needsConsent';
}

/** 화면에 들어왔을 때 사용자 조작 없이 위치를 읽어도 되는지. 준비됐고 권한이 이미 허용됐을 때만 true. */
export function shouldLocateOnEntry(input: {
  access: LocationAccess;
  permission: LocationPermission;
}): boolean {
  return input.access === 'ready' && input.permission === 'granted';
}
