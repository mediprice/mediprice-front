'use client';

import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

import {
  type FirstViewPhase,
  isRectInViewport,
  startPhase,
} from './first-view';
import { prefersReducedMotion } from './use-prefers-reduced-motion';

/**
 * 요소가 처음 화면에 들어올 때 'playing'이 된다. 서버 렌더와 JS가 없을 때는 'static'이라 내용이 그대로 보인다.
 * 칠하기 전에(useLayoutEffect) 시작 모습으로 바꿔 클라이언트에서 새로 그린 요소가 깜빡이지 않는다.
 */
export function useFirstView<T extends Element>({
  playIfVisible = false,
  threshold = 0.2,
}: { playIfVisible?: boolean; threshold?: number } = {}): [
  RefObject<T | null>,
  FirstViewPhase,
] {
  const ref = useRef<T>(null);
  const [phase, setPhase] = useState<FirstViewPhase>('static');

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const start = startPhase({
      reducedMotion: prefersReducedMotion(),
      canObserve: typeof IntersectionObserver !== 'undefined',
      isInViewport: isRectInViewport(
        element.getBoundingClientRect(),
        window.innerHeight,
      ),
      playIfVisible,
    });
    if (start === 'static') return;
    setPhase('waiting');
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        /** 시작 모습이 한 번 칠해진 뒤 바꿔야 전환이 재생된다. */
        requestAnimationFrame(() => setPhase('playing'));
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [playIfVisible, threshold]);

  return [ref, phase];
}
