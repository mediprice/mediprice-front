import type { SessionStatus } from '@/features/auth/use-session';
import type { LocationPermission } from '@/features/map/geolocation';

export type LocationAccess = 'signedOut' | 'needsConsent' | 'ready';

/** 동의 현황 쿼리의 상태와, 받은 값에서 위치 동의가 유효한지. */
export type ConsentQueryState = {
  isPending: boolean;
  isFetching: boolean;
  isStale: boolean;
  isError: boolean;
  isConsentActive: boolean;
};

/** 세션·동의 현황으로 위치 기능을 쓸 수 있는지. 모르거나 오래된 값을 다시 받는 중이면 null, 받기에 실패했으면 동의 없음으로 닫는다. */
export function resolveLocationAccess(input: {
  session: SessionStatus;
  consent: ConsentQueryState;
}): LocationAccess | null {
  const { session, consent } = input;
  if (session === 'pending') return null;
  if (session !== 'authenticated') return 'signedOut';
  if (consent.isPending || (consent.isFetching && consent.isStale)) return null;
  if (consent.isError) return 'needsConsent';
  return consent.isConsentActive ? 'ready' : 'needsConsent';
}

/** 화면에 들어왔을 때 사용자 조작 없이 위치를 읽어도 되는지. 준비됐고 권한이 이미 허용됐을 때만 true. */
export function shouldLocateOnEntry(input: {
  access: LocationAccess;
  permission: LocationPermission;
}): boolean {
  return input.access === 'ready' && input.permission === 'granted';
}

/** 지도 진입 때 할 일. denied는 지역 기준으로 보여 주며 권한을 바꾸는 방법을, fallback은 "내 위치 사용"을 안내한다. */
export type EntryStep = 'wait' | 'locate' | 'fallback' | 'denied';

/** 권한이 허용됐는데 로그인·동의 상태(access)를 아직 모르면 기다린다. 먼저 지역 중심을 조회했다가 다시 찾지 않게 한다. */
export function locationEntryStep(input: {
  access: LocationAccess | null;
  permission: LocationPermission;
}): EntryStep {
  const { access, permission } = input;
  if (permission === 'checking') return 'wait';
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'fallback';
  if (access === null) return 'wait';
  return shouldLocateOnEntry({ access, permission }) ? 'locate' : 'fallback';
}
