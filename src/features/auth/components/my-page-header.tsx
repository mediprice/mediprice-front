import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { cn } from '@/lib/utils';

/** 내 정보 화면의 흰 머리(경로·문장형 제목·설명). 색 띠를 쓰지 않는다. md 구간은 모바일 한 열을 가운데 좁은 폭으로 둔다(본문도 같은 폭). */
export function MyPageHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('bg-bg', className)}>
      <PageContainer className="flex flex-col gap-2 pt-6 pb-5 md:max-w-2xl lg:max-w-page lg:pt-8 lg:pb-8">
        {children}
      </PageContainer>
    </div>
  );
}
