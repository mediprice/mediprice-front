'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 응답이 끝내 오지 않아도 막대가 남지 않게 한다. */
const GIVE_UP_MS = 15_000;

/** 앱 안 다른 화면으로 가는 링크인지. 새 탭·다른 출처·같은 화면의 #앵커·다운로드는 브라우저가 처리한다. */
function isAppNavigation(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return false;
  const anchor = (event.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  const next = new URL(anchor.href, window.location.href);
  if (next.origin !== window.location.origin) return false;
  return (
    next.pathname !== window.location.pathname ||
    next.search !== window.location.search
  );
}

/**
 * 링크를 누른 뒤 다음 화면이 그려질 때까지 화면 맨 위에 얇은 막대를 보여 준다. 항목·병원 화면은 서버에서 가격을 읽은 뒤
 * 그리므로(진짜 404를 지키려고 loading.tsx를 두지 않는다) 그동안 누른 것이 먹혔는지 알려 준다.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const current = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (isAppNavigation(event)) setPendingFrom(current);
    }
    /** Link가 자기 처리에서 기본 동작을 막기 전에 보려고 캡처 단계에서 듣는다. */
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [current]);

  useEffect(() => {
    if (pendingFrom === null) return;
    const timer = window.setTimeout(() => setPendingFrom(null), GIVE_UP_MS);
    return () => window.clearTimeout(timer);
  }, [pendingFrom]);

  /** 화면이 바뀌면 끝난 것이다. 뒤로 가기처럼 다른 경로로 바뀌어도 같다. */
  const isPending = pendingFrom !== null && pendingFrom === current;
  if (!isPending) return null;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-(--z-toast) h-0.5 overflow-hidden bg-primary-tint"
    >
      <div className="h-full w-1/3 animate-[nav-progress_1.2s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}
