'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const ResponsiveDialog = Dialog.Root;
export const ResponsiveDialogTrigger = Dialog.Trigger;

/** md(768px) 미만은 바텀시트, md부터 가운데 모달. 화면 폭을 JS로 재지 않고 CSS로만 바꾼다(docs 13.3). */
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
          /** 낮은 화면(가로 모드·큰 글자)에서는 머리·바닥이 본문을 가리지 않게 시트 전체를 한 번에 스크롤한다. */
          '[@media(max-height:40rem)]:overflow-y-auto',
          'duration-200 ease-standard data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
          'md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[80dvh] md:w-[calc(100%-4rem)] md:max-w-lg md:-translate-1/2 md:rounded-xl md:pb-0 md:shadow-float',
          'md:data-[state=closed]:fade-out-0 md:data-[state=closed]:slide-out-to-bottom-4 md:data-[state=open]:fade-in-0 md:data-[state=open]:slide-in-from-bottom-4',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong/50 md:hidden"
        />
        <div className="flex shrink-0 items-center justify-between gap-2 pt-2 pr-2 pl-4 md:pt-4 md:pr-3 md:pl-6">
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4 md:px-6 md:pb-6 [@media(max-height:40rem)]:flex-none [@media(max-height:40rem)]:overflow-visible">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-hairline bg-bg px-4 py-3 md:rounded-b-xl md:px-6 md:py-4">
            {footer}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
