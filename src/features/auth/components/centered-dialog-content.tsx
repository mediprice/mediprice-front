'use client';

import type { ComponentProps } from 'react';

import { ResponsiveDialogContent } from '@/components/ui/responsive-dialog';
import { cn } from '@/lib/utils';

/** 확인 다이얼로그(탈퇴 확인·인증 만료)는 모든 화면 폭에서 가운데 모달이다(docs 13.3). 시트 손잡이는 숨긴다. */
export function CenteredDialogContent({
  className,
  ...props
}: ComponentProps<typeof ResponsiveDialogContent>) {
  return (
    <ResponsiveDialogContent
      className={cn(
        'inset-x-auto top-1/2 bottom-auto left-1/2 max-h-[80dvh] w-[calc(100%-4rem)] max-w-100 -translate-1/2 rounded-xl pb-0 shadow-float md:max-w-100',
        '[&>span:first-child]:hidden',
        className,
      )}
      {...props}
    />
  );
}
