import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { BrandLink } from './brand-link';
import type { NavItem } from './nav-item';
import { NavLink } from './nav-link';

/** 데스크톱(lg 이상) 상단 내비게이션. 활성 항목은 굵기 대신 밑줄로 표시해 옆 항목이 밀리지 않게 한다. */
export function TopNav({
  items,
  actions,
}: {
  items: NavItem[];
  actions?: ReactNode;
}) {
  const t = useTranslations('nav');
  return (
    <header className="sticky top-0 z-(--z-header) hidden h-top-nav border-b border-hairline bg-bg lg:block">
      <div className="mx-auto grid h-full w-full max-w-page grid-cols-[1fr_auto_1fr] items-center px-page">
        <div className="justify-self-start">
          <BrandLink />
        </div>
        <nav aria-label={t('mainMenu')} className="flex h-full gap-4">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="relative inline-flex h-full min-w-11 items-center justify-center px-3 text-label text-text-secondary -outline-offset-8 transition-colors duration-200 ease-standard after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity after:duration-200 hover:text-text-primary aria-[current=page]:text-text-primary aria-[current=page]:after:opacity-100"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 justify-self-end">
          {actions}
        </div>
      </div>
    </header>
  );
}
