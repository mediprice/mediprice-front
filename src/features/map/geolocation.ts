import { isInKorea, type LatLng, roundLatLng } from './map-geo';

/** 브라우저 권한 상태. 권한 API가 없는 브라우저(구형 Safari)는 물어봐야 아는 'prompt'로 본다. */
export type LocationPermission =
  'checking' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export type LocateResult =
  | { status: 'located'; position: LatLng }
  /** 사용자가 거부했다. 브라우저 설정에서 바꿔야 한다. */
  | { status: 'denied' }
  /** 위치를 못 얻었다(신호 없음·시간 초과). 다시 시도할 수 있다. */
  | { status: 'unavailable' }
  /** 서비스 범위(한국) 밖이다. */
  | { status: 'outside' };

export type LocationState =
  | { status: 'idle' | 'locating' | 'denied' | 'unavailable' | 'outside' }
  | { status: 'located'; position: LatLng };

const PERMISSION_DENIED = 1;

function classifyPositionError(
  error: Pick<GeolocationPositionError, 'code'>,
): LocateResult {
  return error.code === PERMISSION_DENIED
    ? { status: 'denied' }
    : { status: 'unavailable' };
}

function classifyPosition(
  coords: Pick<GeolocationCoordinates, 'latitude' | 'longitude'>,
): LocateResult {
  const position = { lat: coords.latitude, lng: coords.longitude };
  return isInKorea(position)
    ? { status: 'located', position: roundLatLng(position) }
    : { status: 'outside' };
}

const LOCATE_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000,
};

/** 현재 위치를 한 번 묻는다. 위치 API가 없으면 거부가 아니라 사용 불가로 끝낸다. */
export function locateOnce(
  geolocation: Pick<Geolocation, 'getCurrentPosition'> | undefined,
) {
  return new Promise<LocateResult>((resolve) => {
    if (!geolocation) {
      resolve({ status: 'unavailable' });
      return;
    }
    geolocation.getCurrentPosition(
      (position) => resolve(classifyPosition(position.coords)),
      (error) => resolve(classifyPositionError(error)),
      LOCATE_OPTIONS,
    );
  });
}

type PermissionsLike = {
  query: (descriptor: {
    name: 'geolocation';
  }) => Promise<
    Pick<PermissionStatus, 'state'> &
      Partial<
        Pick<PermissionStatus, 'addEventListener' | 'removeEventListener'>
      >
  >;
};

/** 권한 API로 묻지 않고 상태만 읽는다. 지원하지 않거나 실패하면 'unsupported'다. */
export async function readPermission(permissions: PermissionsLike | undefined) {
  if (!permissions) return { state: 'unsupported' as const, status: null };
  try {
    const status = await permissions.query({ name: 'geolocation' });
    return { state: status.state, status };
  } catch {
    return { state: 'unsupported' as const, status: null };
  }
}
