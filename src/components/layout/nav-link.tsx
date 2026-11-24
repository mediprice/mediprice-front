'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

function isCurrentPath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 현재 경로면 aria-current="page"를 붙인다. 활성 스타일은 부모가 aria-[current=page]: 로 준다. */
export function NavLink({
  href,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & { href: Route }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      aria-current={isCurrentPath(pathname, href) ? 'page' : undefined}
      {...props}
    />
  );
}
