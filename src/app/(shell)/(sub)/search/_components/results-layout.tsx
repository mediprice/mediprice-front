import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';

/** 모바일은 회색 바탕에 목록 다음 제안 카드, lg부터 흰 바탕에 목록과 360px 오른쪽 열이다. */
export function ResultsLayout({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex-1 bg-surface lg:bg-bg">
      <PageContainer className="grid grid-cols-1 gap-6 pt-2 pb-section lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start lg:gap-10 lg:pt-0 [&>*]:min-w-0">
        <div className="min-w-0 space-y-4">{children}</div>
        {aside}
      </PageContainer>
    </div>
  );
}
