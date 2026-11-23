'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useToastStore } from './toast-store';

/** 행동 버튼이 있으면 누를 시간을 더 준다. */
const DURATION_MS = 4000;
const DURATION_WITH_ACTION_MS = 7000;

/**
 * 결과 알림. 모바일은 하단 탭바 위, 데스크톱은 화면 아래 가운데. 낭독기에는 role=status로 한 번 읽힌다.
 * 포커스를 옮기지 않아 하던 일을 방해하지 않는다.
 */
export function Toaster() {
  const t = useTranslations('common.actions');
  const toast = useToastStore((state) => state.toast);
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(
      () => dismiss(toast.id),
      toast.action ? DURATION_WITH_ACTION_MS : DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-tab-bar)+env(safe-area-inset-bottom,0px)+0.75rem)] z-(--z-toast) flex justify-center px-page lg:bottom-8"
    >
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-md min-w-0 items-center gap-3 rounded-lg bg-text-primary py-2 pr-2 pl-4 text-body-sm text-on-primary shadow-float transition-[opacity,translate] duration-200 ease-enter starting:translate-y-2 starting:opacity-0"
        >
          <p className="min-w-0 flex-1 py-1.5">{toast.text}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                dismiss(toast.id);
              }}
              className="min-h-11 shrink-0 rounded-md px-3 text-label-bold text-on-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-focus-ring-inverse"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label={t('close')}
            onClick={() => dismiss(toast.id)}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-on-primary/80 hover:text-on-primary focus-visible:outline-2 focus-visible:outline-focus-ring-inverse"
          >
            <X aria-hidden="true" className="size-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
