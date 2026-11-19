'use client';

import { useTranslations } from 'next-intl';
import { AlertDialog } from 'radix-ui';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/** 비교함 비우기 확인. 확인 다이얼로그는 모든 화면 크기에서 가운데 320px 모달이다(docs 13.3). */
export function ClearCompareDialog({
  count,
  onConfirm,
  children,
}: {
  count: number;
  onConfirm: () => void;
  /** 다이얼로그를 여는 버튼. */
  children: ReactNode;
}) {
  const t = useTranslations('comparison.clearDialog');
  const tActions = useTranslations('common.actions');

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay duration-200 ease-standard data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-(--z-overlay) flex w-[calc(100%-2.5rem)] max-w-80 -translate-1/2 flex-col gap-2 rounded-xl bg-bg p-5 shadow-float duration-200 ease-standard outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <AlertDialog.Title className="text-subheading">
            {t('title')}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-body-sm text-text-secondary">
            {t('description', { count })}
          </AlertDialog.Description>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="neutral" size="md">
                {tActions('cancel')}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="danger" size="md" onClick={onConfirm}>
                {t('confirm')}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
