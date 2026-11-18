import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { cn } from '@/lib/utils';

/** 내 정보 화면 위쪽의 연한 파란 띠. md 구간은 모바일 한 열을 가운데 좁은 폭으로 둔다(본문도 같은 폭). */
export function MyPageHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('bg-primary-tint', className)}>
      <PageContainer className="flex flex-col gap-2 py-6 md:max-w-2xl lg:max-w-page lg:py-10">
        {children}
      </PageContainer>
    </div>
  );
}
