import type { ReactNode } from 'react';

import { BrandLink } from './brand-link';
import type { NavItem } from './nav-item';
import { NavLink } from './nav-link';

/** 데스크톱(lg 이상) 상단 내비게이션. 모바일은 MobileTopBar와 BottomTabBar가 맡는다. */
export function TopNav({
  items,
  actions,
}: {
  items: NavItem[];
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 hidden border-b border-hairline bg-bg lg:block">
      <div className="mx-auto flex h-top-nav w-full max-w-page items-center gap-10 px-8">
        <BrandLink />
        <nav className="flex flex-1 justify-center gap-10">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="text-label text-text-tertiary hover:text-text-primary aria-[current=page]:font-bold aria-[current=page]:text-text-primary"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
