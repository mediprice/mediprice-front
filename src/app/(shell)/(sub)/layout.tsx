import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';
import { CompareTray } from '@/features/comparison/components/compare-tray';

/** 하위 화면(검색 결과·항목 가격·병원 상세·비교). 모바일은 페이지가 SubTopBar를 직접 렌더하고 하단 탭바가 없다. */
export default function SubLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 flex-col outline-none"
        >
          {children}
        </main>
        <SiteFooter />
      </div>
      <CompareTray />
    </>
  );
}
