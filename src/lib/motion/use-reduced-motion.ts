'use client';

import { useSyncExternalStore } from 'react';

import { REDUCED_MOTION_QUERY } from './prefers-reduced-motion';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** reduced-motion 설정을 구독한다. CSS 전역 규칙이 닿지 않는 JS 애니메이션(지도 SDK 이동 등)에 쓴다. 서버 렌더에서는 움직이지 않는 쪽이다. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
}
