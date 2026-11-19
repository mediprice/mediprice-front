import { useTranslations } from 'next-intl';

import type { NavItem } from './nav-item';
import { NavLink } from './nav-link';

/** 모바일(lg 미만) 하단 탭바. 그림자 없이 위 구분선만 둔다. 활성 탭은 색·굵기·채운 아이콘으로 함께 표시한다. 이 바를 쓰는 레이아웃은 본문에 pb-tab-bar를 준다. */
export function BottomTabBar({ items }: { items: NavItem[] }) {
  const t = useTranslations('nav');
  return (
    <nav
      data-bottom-tab-bar
      aria-label={t('tabMenu')}
      className="fixed inset-x-0 bottom-0 z-(--z-tab-bar) border-t border-border bg-bg px-safe pb-safe lg:hidden"
    >
      <ul className="flex h-tab-bar">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <NavLink
              href={item.href}
              className="flex h-full flex-col items-center justify-center gap-1 text-caption-strong text-text-tertiary -outline-offset-2 transition-colors duration-200 ease-standard active:bg-surface aria-[current=page]:text-caption-bold aria-[current=page]:text-primary-text [&_svg]:size-6 aria-[current=page]:[&_svg]:fill-current"
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
