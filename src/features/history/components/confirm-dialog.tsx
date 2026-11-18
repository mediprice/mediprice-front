'use client';

import { AlertDialog } from 'radix-ui';
import { type ComponentProps, type ReactNode, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ButtonVariant = ComponentProps<typeof Button>['variant'];

/**
 * 삭제·이탈 확인. 모든 화면 폭에서 가운데 320px 모달이고(docs 13.3), 열리면 안전한 쪽(취소) 버튼에 포커스가 간다.
 * 확인 중(isPending)에는 닫히지 않아 결과(오류)를 다이얼로그 안에서 보여 줄 수 있다.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  confirmVariant = 'danger',
  cancelVariant = 'neutral',
  isConfirmFirst = false,
  isPending = false,
  error,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  confirmVariant?: ButtonVariant;
  cancelVariant?: ButtonVariant;
  /** 확인 버튼을 왼쪽에 둔다(이탈 확인처럼 머무는 쪽이 대표 행동일 때). */
  isConfirmFirst?: boolean;
  isPending?: boolean;
  /** 실패 문구. 번역한 문자열을 넘긴다. */
  error?: ReactNode;
  /** 여는 버튼이 사라지는 경우(전체 삭제 뒤 빈 화면) 포커스를 옮길 곳을 정한다. */
  onCloseAutoFocus?: (event: Event) => void;
}) {
  /** Trigger 없이 여닫으므로 Radix가 포커스를 돌려줄 곳을 모른다. 열 때의 포커스를 기억했다가 돌려준다. */
  const openerRef = useRef<HTMLElement | null>(null);
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay duration-200 ease-standard data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          onOpenAutoFocus={() => {
            openerRef.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            if (event.defaultPrevented) return;
            event.preventDefault();
            openerRef.current?.focus();
          }}
          className="fixed top-1/2 left-1/2 z-(--z-overlay) flex max-h-[80dvh] w-[calc(100%-2.5rem)] max-w-80 -translate-1/2 flex-col gap-2 overflow-y-auto rounded-xl bg-bg p-5 shadow-float duration-200 ease-standard outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <AlertDialog.Title className="text-subheading">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-body-sm text-text-secondary">
            {description}
          </AlertDialog.Description>
          {error && (
            <p role="alert" className="text-body-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <AlertDialog.Cancel asChild>
              <Button
                variant={cancelVariant}
                size="md"
                aria-disabled={isPending || undefined}
                className={cn(
                  isConfirmFirst && 'order-last',
                  isPending && 'pointer-events-none',
                )}
              >
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant={confirmVariant}
              size="md"
              isLoading={isPending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
