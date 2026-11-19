'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

type AdminNavItem = { key: 'overview' | 'reports' | 'claims'; href: Route };

/** 처리 대기열이 늘면 항목을 더한다. */
const ITEMS: readonly AdminNavItem[] = [
  { key: 'overview', href: '/admin' },
  { key: 'reports', href: '/admin/reports' },
  { key: 'claims', href: '/admin/claims' },
];

function isCurrent(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** 운영 화면의 탭. 현재 항목은 굵기와 밑줄로 함께 알린다. */
export function AdminNav() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();
  return (
    <nav aria-label={t('label')} className="border-b border-hairline">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {ITEMS.map((item) => (
          <li key={item.key} className="shrink-0">
            <Link
              href={item.href}
              aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
              className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-label text-text-secondary transition-colors duration-200 ease-standard hover:text-text-primary aria-[current=page]:border-primary aria-[current=page]:text-label-bold aria-[current=page]:text-primary-text"
            >
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
