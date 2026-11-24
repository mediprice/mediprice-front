'use client';

import { type RefObject, useEffect, useState } from 'react';

/** 화면 아래에 고정된 요소가 가리는 높이. 본문 끝에 같은 높이의 여백을 두고, 포커스 이동이 가려지지 않게 scroll-padding도 맞춘다. */
export function useCoveredHeight(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!isActive || !element) return;
    const root = document.documentElement;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      /** 입력 중에 숨은(display: none) 동안은 여백을 그대로 두고, 스크롤 여백만 전역 규칙에 맡긴다. */
      if (rect.height === 0) {
        root.style.removeProperty('scroll-padding-bottom');
        return;
      }
      const covered = Math.max(0, Math.ceil(window.innerHeight - rect.top));
      setHeight(covered);
      root.style.setProperty('scroll-padding-bottom', `${covered + 8}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty('scroll-padding-bottom');
    };
  }, [ref, isActive]);

  return isActive ? height : 0;
}
