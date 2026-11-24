'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { appLinkTarget } from './app-link';

/** 다른 핸들러가 이미 막은 클릭은 그대로 둔다. */
function interceptedHref(event: MouseEvent) {
  if (event.defaultPrevented) return null;
  const url = appLinkTarget(event);
  return url ? `${url.pathname}${url.search}${url.hash}` : null;
}

/**
 * 저장하지 않은 입력이 있을 때 새로고침·창 닫기와 문서 전체(상단 메뉴·푸터 포함)의 앱 안 링크 이동을 멈추고 확인을 받는다.
 * App Router에는 이동 취소 API가 없어 링크 클릭을 문서 캡처 단계에서 막는다(Next Link는 defaultPrevented면 이동하지 않는다).
 * 브라우저 뒤로 가기는 막을 수 없다.
 */
export function useLeaveGuard(isDirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    function handleClick(event: MouseEvent) {
      const href = interceptedHref(event);
      if (!href) return;
      event.preventDefault();
      setPendingHref(href);
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isDirty]);

  return {
    pendingHref,
    /** 바뀐 내용이 있으면 확인을 받고, 없으면 바로 옮긴다. */
    requestLeave: (href: string) => {
      if (isDirty) setPendingHref(href);
      else router.push(href as Route);
    },
    confirmLeave: () => {
      if (!pendingHref) return;
      setPendingHref(null);
      /** 같은 출처의 DOM 링크나 화면이 만든 앱 안 경로라 typedRoutes가 미리 검사할 수 없다. */
      router.push(pendingHref as Route);
    },
    cancelLeave: () => setPendingHref(null),
  };
}
