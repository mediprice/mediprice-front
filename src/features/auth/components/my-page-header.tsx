import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { cn } from '@/lib/utils';

/** 내 정보 화면 위쪽의 연한 파란 띠. */
export function MyPageHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('bg-linear-to-b from-hero to-bg', className)}>
      <PageContainer className="flex flex-col gap-2 py-6 lg:py-10">
        {children}
      </PageContainer>
    </div>
  );
}
