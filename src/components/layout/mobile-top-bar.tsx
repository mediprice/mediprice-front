import type { ReactNode } from 'react';

import { BrandLink } from './brand-link';

/** 모바일 탭 루트 화면의 상단 바(로고와 우측 동작). 하위 화면은 SubTopBar를 쓴다. */
export function MobileTopBar({ actions }: { actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-(--z-header) bg-bg pt-safe lg:hidden">
      <div className="flex h-top-bar items-center justify-between gap-2 px-page">
        <div className="min-w-0">
          <BrandLink />
        </div>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
