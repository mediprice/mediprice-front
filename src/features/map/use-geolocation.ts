'use client';

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';

import {
  locateOnce,
  type LocateResult,
  type LocationPermission,
  type LocationState,
  readPermission,
} from './geolocation';

type ReadyPermission = Exclude<LocationPermission, 'checking'>;

/**
 * 권한 상태를 구독하고, locate()를 부를 때만 위치를 묻는다. 위치는 화면 상태로만 두고 저장하지 않는다.
 * onPermissionReady는 처음 권한 상태를 읽었을 때 한 번 불린다(바로 찾을지, 먼저 물어볼지 정하는 곳).
 */
export function useGeolocation({
  onPermissionReady,
}: {
  onPermissionReady?: (permission: ReadyPermission) => void;
} = {}) {
  const [permission, setPermission] = useState<LocationPermission>('checking');
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const requestId = useRef(0);
  const notifyReady = useEffectEvent((state: ReadyPermission) =>
    onPermissionReady?.(state),
  );

  useEffect(() => {
    let isActive = true;
    let cleanup: (() => void) | undefined;
    void readPermission(navigator.permissions).then(({ state, status }) => {
      if (!isActive) return;
      setPermission(state);
      notifyReady(state);
      if (!status?.addEventListener) return;
      const handleChange = () => setPermission(status.state);
      status.addEventListener('change', handleChange);
      cleanup = () => status.removeEventListener?.('change', handleChange);
    });
    return () => {
      isActive = false;
      cleanup?.();
    };
  }, []);

  const locate = useCallback(async (): Promise<LocateResult | null> => {
    const id = ++requestId.current;
    setLocation({ status: 'locating' });
    const result = await locateOnce(navigator.geolocation);
    if (id !== requestId.current) return null;
    setLocation(result);
    if (result.status === 'denied') setPermission('denied');
    if (result.status === 'located') setPermission('granted');
    return result;
  }, []);

  return { permission, location, locate };
}
