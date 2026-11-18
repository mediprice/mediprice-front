import type { NavItem } from './nav-item';
import { NavLink } from './nav-link';

/** 모바일(lg 미만) 하단 탭바. 이 바를 쓰는 레이아웃은 본문에 pb-tab-bar를 줘서 가려지지 않게 한다. */
export function BottomTabBar({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg pb-safe shadow-bar lg:hidden">
      <ul className="flex h-tab-bar">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <NavLink
              href={item.href}
              className="flex h-full flex-col items-center justify-center gap-1 text-caption-strong text-text-tertiary aria-[current=page]:text-primary-text [&_svg]:size-6"
            >
              {item.icon}
              {item.shortLabel ?? item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
