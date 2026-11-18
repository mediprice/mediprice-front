import type { ReactNode } from 'react';

import { BrandLink } from './brand-link';

/** 모바일 탭 루트 화면의 상단 바(로고와 우측 동작). 하위 화면은 SubTopBar를 쓴다. */
export function MobileTopBar({ actions }: { actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 bg-bg pt-safe lg:hidden">
      <div className="flex h-top-bar items-center justify-between px-4">
        <BrandLink />
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
