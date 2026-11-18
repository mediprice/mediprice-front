'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { type MouseEvent, useEffect, useState } from 'react';

/** 저장하지 않은 입력이 있을 때 새로고침·창 닫기와 이 화면 안의 링크 이동을 멈추고 확인을 받는다. */
export function useLeaveGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  /** 캡처 단계에서 막아야 Next Link의 onClick(이동)이 실행되지 않는다. */
  function handleClickCapture(event: MouseEvent) {
    if (!isDirty || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[href]')
        : null;
    if (!anchor || anchor.target === '_blank') return;
    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    event.stopPropagation();
    setPendingHref(`${url.pathname}${url.search}${url.hash}`);
  }

  return {
    pendingHref,
    handleClickCapture,
    /** 바뀐 내용이 있으면 확인을 받고, 없으면 바로 옮긴다. */
    requestLeave: (href: string) => {
      if (isDirty) setPendingHref(href);
      else router.push(href as Route);
    },
    confirmLeave: () => {
      if (!pendingHref) return;
      setPendingHref(null);
      /** 같은 출처의 링크나 이 화면이 만든 경로만 들어온다. */
      router.push(pendingHref as Route);
    },
    cancelLeave: () => setPendingHref(null),
  };
}
