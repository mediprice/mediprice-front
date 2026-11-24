import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** 화면 폭별 좌우 여백(16·24·32px, 노치 포함)과 데스크톱 1200px 본문 폭을 맞춘다. */
export function PageContainer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-container"
      className={cn('mx-auto w-full max-w-page px-page', className)}
      {...props}
    />
  );
}
