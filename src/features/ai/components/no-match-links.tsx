import { ChevronRight, LayoutGrid, Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** 맞는 항목이 없을 때 직접 찾을 수 있는 두 길. 카테고리를 앞에 둔다. */
export function NoMatchLinks() {
  const t = useTranslations('ai.noMatch');
  return (
    <ul className="flex max-w-md flex-col overflow-hidden rounded-2xl bg-surface">
      <NoMatchLink
        href={{ pathname: '/search', query: { category: 'all' } }}
        icon={<LayoutGrid aria-hidden="true" strokeWidth={1.75} />}
        title={t('category')}
        hint={t('categoryHint')}
      />
      <NoMatchLink
        href={{ pathname: '/search' }}
        icon={<Search aria-hidden="true" strokeWidth={1.75} />}
        title={t('search')}
        hint={t('searchHint')}
      />
    </ul>
  );
}

function NoMatchLink({
  href,
  icon,
  title,
  hint,
}: {
  href: { pathname: string; query?: Record<string, string> };
  icon: ReactNode;
  title: ReactNode;
  hint: ReactNode;
}) {
  return (
    <li className="border-hairline not-first:border-t">
      <Link
        href={href}
        className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors duration-200 ease-standard hover:bg-surface-strong active:bg-surface-strong [&>svg:first-child]:size-5 [&>svg:first-child]:shrink-0 [&>svg:first-child]:text-primary-text"
      >
        {icon}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-label-bold text-text-primary">{title}</span>
          <span className="text-body-sm text-text-secondary">{hint}</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-text-tertiary"
          strokeWidth={1.75}
        />
      </Link>
    </li>
  );
}
