'use client';

import {
  type FocusEvent,
  type PointerEvent,
  useEffect,
  useReducer,
  useSyncExternalStore,
} from 'react';

import { initialRotation, isRotationPaused, rotationReducer } from './rotation';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/**
 * length개를 intervalMs마다 돌린다. 마우스를 올리거나 포커스가 안에 있거나 탭이 숨겨지면 멈추고,
 * reduced-motion이면 사용자 멈춤으로 시작한다(재생을 누르면 돈다). once면 한 바퀴 돌아 처음에서 멈춘다.
 * rootProps는 돌아가는 영역 전체에 붙인다.
 */
export function useRotation(
  length: number,
  intervalMs: number,
  { once = false }: { once?: boolean } = {},
) {
  const [state, dispatch] = useReducer(rotationReducer, initialRotation);
  const reducedMotion = usePrefersReducedMotion();
  const isDocumentHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );
  const paused = isRotationPaused(state) || isDocumentHidden;

  useEffect(() => {
    if (reducedMotion) dispatch({ type: 'pause' });
  }, [reducedMotion]);

  useEffect(() => {
    if (paused || length < 2) return;
    const timer = window.setInterval(
      () => dispatch({ type: 'tick', length, once }),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [paused, length, intervalMs, once, state.index]);

  return {
    index: Math.min(state.index, Math.max(length - 1, 0)),
    paused,
    /** 멈춤 버튼의 상태(문구·아이콘)는 이것으로 고른다. paused는 마우스·포커스 때문에도 참이 된다. */
    isUserPaused: state.isUserPaused,
    next: () => dispatch({ type: 'next', length }),
    prev: () => dispatch({ type: 'prev', length }),
    goTo: (index: number) => dispatch({ type: 'goTo', index, length }),
    toggle: () => dispatch({ type: 'toggle' }),
    rootProps: {
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === 'mouse')
          dispatch({ type: 'hover', value: true });
      },
      onPointerLeave: (event: PointerEvent) => {
        if (event.pointerType === 'mouse')
          dispatch({ type: 'hover', value: false });
      },
      onFocus: () => dispatch({ type: 'focus', value: true }),
      onBlur: (event: FocusEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          dispatch({ type: 'focus', value: false });
      },
    },
  };
}
