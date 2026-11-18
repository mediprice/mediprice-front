'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const ResponsiveDialog = Dialog.Root;
export const ResponsiveDialogTrigger = Dialog.Trigger;

/** lg 미만은 바텀시트, lg부터 가운데 모달. 화면 폭을 JS로 재지 않고 CSS로만 바꾼다(docs 13.3). */
export function ResponsiveDialogContent({
  title,
  description,
  footer,
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof Dialog.Content>, 'title'> & {
  title: string;
  /** 보조 설명. 화면에는 숨기고 스크린 리더에만 읽힌다. */
  description?: string;
  /** 하단에 고정되는 행동 영역(초기화·적용). */
  footer?: ReactNode;
}) {
  const t = useTranslations('common.actions');
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay duration-200 ease-standard data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <Dialog.Content
        data-slot="responsive-dialog"
        {...(!description && { 'aria-describedby': undefined })}
        className={cn(
          'fixed inset-x-0 bottom-0 z-(--z-overlay) flex max-h-[88dvh] flex-col rounded-t-3xl bg-bg pb-safe shadow-sheet outline-none',
          'duration-200 ease-standard data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
          'lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[80dvh] lg:w-[calc(100%-4rem)] lg:max-w-lg lg:-translate-1/2 lg:rounded-xl lg:pb-0 lg:shadow-float',
          'lg:data-[state=closed]:fade-out-0 lg:data-[state=closed]:slide-out-to-bottom-4 lg:data-[state=open]:fade-in-0 lg:data-[state=open]:slide-in-from-bottom-4',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong/50 lg:hidden"
        />
        <div className="flex shrink-0 items-center justify-between gap-2 pt-2 pr-2 pl-4 lg:pt-4 lg:pr-3 lg:pl-6">
          <Dialog.Title className="text-heading">{title}</Dialog.Title>
          <Dialog.Close
            aria-label={t('close')}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface active:bg-surface-strong"
          >
            <X aria-hidden="true" className="size-6" strokeWidth={2} />
          </Dialog.Close>
        </div>
        {description && (
          <Dialog.Description className="sr-only">
            {description}
          </Dialog.Description>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4 lg:px-6 lg:pb-6">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 gap-2 border-t border-hairline bg-bg px-4 py-3 lg:rounded-b-xl lg:px-6 lg:py-4">
            {footer}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
