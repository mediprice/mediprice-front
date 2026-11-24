'use client';

import type { ComponentProps } from 'react';

import { ResponsiveDialogContent } from '@/components/ui/responsive-dialog';
import { cn } from '@/lib/utils';

/** 확인 다이얼로그는 모든 화면 폭에서 가운데 모달이다(docs 13.3). 큰 글자에서 폭이 줄지 않게 calc 폭 대신 좌우 여백으로 맞춘다. */
export function CenteredDialogContent({
  className,
  ...props
}: ComponentProps<typeof ResponsiveDialogContent>) {
  return (
    <ResponsiveDialogContent
      className={cn(
        'inset-x-4 inset-y-0 m-auto h-fit max-h-[80dvh] w-auto max-w-100 translate-none rounded-xl pb-0 shadow-float max-[22rem]:inset-x-2',
        'md:inset-x-4 md:inset-y-0 md:w-auto md:max-w-100 md:translate-none',
        '[&>span:first-child]:hidden',
        className,
      )}
      {...props}
    />
  );
}
