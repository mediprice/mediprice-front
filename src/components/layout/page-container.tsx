import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** 모바일 좌우 16px, 데스크톱 1200px 본문 폭(1440 화면에서 좌우 120px)을 맞춘다. */
export function PageContainer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-page px-4 lg:px-8', className)}
      {...props}
    />
  );
}
