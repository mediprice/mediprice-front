'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';

import { canGoBackInApp } from '@/lib/navigation/history-depth';

/**
 * 앱 안에서 이동해 왔으면 브라우저 뒤로 가기처럼 돌아가 검색어·필터·스크롤을 되살린다.
 * 공유 링크처럼 이 화면으로 처음 들어왔으면 fallbackHref로 바꿔 간다(기록을 쌓지 않음).
 */
export function BackLink<T extends string>({
  fallbackHref,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href' | 'replace'> & {
  fallbackHref: Route<T>;
}) {
  const router = useRouter();
  return (
    <Link
      {...props}
      href={fallbackHref}
      replace
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        if (canGoBackInApp()) {
          event.preventDefault();
          router.back();
        }
      }}
    />
  );
}
