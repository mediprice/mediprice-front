'use client';

import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';

/** 결과를 알린 다이얼로그를 닫는 폭 전체 "확인" 버튼. */
export function DialogConfirmButton({
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children'>) {
  const t = useTranslations('common.actions');
  return (
    <Button size="lg" className={cn('w-full', className)} {...props}>
      {t('confirm')}
    </Button>
  );
}
