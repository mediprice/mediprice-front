'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  locateOnce,
  type LocateResult,
  type LocationPermission,
  type LocationState,
  readPermission,
} from './geolocation';

/**
 * 권한 상태를 구독하고, locate()를 부를 때만 위치를 묻는다. 위치는 화면 상태로만 두고 저장하지 않는다.
 * 권한을 읽기 전에는 permission이 'checking'이다.
 */
export function useGeolocation() {
  const [permission, setPermission] = useState<LocationPermission>('checking');
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const requestId = useRef(0);

  useEffect(() => {
    let isActive = true;
    let cleanup: (() => void) | undefined;
    void readPermission(navigator.permissions).then(({ state, status }) => {
      if (!isActive) return;
      setPermission(state);
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
