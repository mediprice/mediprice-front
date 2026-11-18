import { ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** 데스크톱 하위 화면 위쪽의 경로. 모바일은 SubTopBar의 뒤로 가기가 대신하므로 기본으로 숨긴다. */
export function Breadcrumb({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  return (
    <nav aria-label={t('breadcrumb')} className="hidden lg:block">
      <ol className="flex flex-wrap items-center gap-1 text-body-sm text-text-secondary [&>li:not(:last-child)]:after:hidden">
        {children}
      </ol>
    </nav>
  );
}

export function BreadcrumbLink<T extends string>({
  href,
  children,
}: {
  href: Route<T>;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-1">
      <Link
        href={href}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-1 hover:text-text-primary hover:underline"
      >
        {children}
      </Link>
      <ChevronRight
        aria-hidden="true"
        className="size-4 text-text-tertiary"
        strokeWidth={1.75}
      />
    </li>
  );
}

export function BreadcrumbCurrent({ children }: { children: ReactNode }) {
  return (
    <li aria-current="page" className="text-label text-text-primary">
      {children}
    </li>
  );
}
