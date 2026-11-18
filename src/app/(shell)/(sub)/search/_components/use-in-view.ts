import { useCallback, useState } from 'react';

/** 요소가 화면 근처에 처음 들어오면 true가 되고 그 뒤로는 바뀌지 않는다. 목록 행마다 가격 요청을 미루는 데 쓴다. */
export function useInView<T extends Element>(rootMargin = '200px') {
  const [isInView, setIsInView] = useState(false);
  const ref = useCallback(
    (node: T | null) => {
      if (!node || isInView) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          setIsInView(true);
          observer.disconnect();
        },
        { rootMargin },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [isInView, rootMargin],
  );
  return [ref, isInView] as const;
}
