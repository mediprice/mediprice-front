'use client';

import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import type { useLeaveGuard } from './use-leave-guard';

/** 삭제 확인과 저장하지 않은 채 나가기 확인. */
export function ProfileDialogs({
  isDeleting,
  onDeletingChange,
  onDelete,
  isDeletePending,
  deleteError,
  isDeleteDone,
  leaveGuard,
}: {
  isDeleting: boolean;
  onDeletingChange: (open: boolean) => void;
  onDelete: () => void;
  isDeletePending: boolean;
  deleteError: string | null;
  /** 삭제 버튼이 사라지므로 닫힐 때 포커스를 제목으로 옮긴다. */
  isDeleteDone: boolean;
  leaveGuard: ReturnType<typeof useLeaveGuard>;
}) {
  const t = useTranslations('library.medicalProfile');
  const tCommon = useTranslations('common.actions');
  return (
    <>
      <ConfirmDialog
        open={isDeleting}
        onOpenChange={onDeletingChange}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description')}
        cancelLabel={tCommon('cancel')}
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={onDelete}
        isPending={isDeletePending}
        error={deleteError}
        onCloseAutoFocus={(event) => {
          if (!isDeleteDone) return;
          event.preventDefault();
          document.getElementById('medical-profile-title')?.focus();
        }}
      />
      <ConfirmDialog
        open={leaveGuard.pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) leaveGuard.stay();
        }}
        title={t('leaveDialog.title')}
        description={t('leaveDialog.description')}
        cancelLabel={t('leaveDialog.stay')}
        confirmLabel={t('leaveDialog.leave')}
        onConfirm={leaveGuard.leave}
        cancelVariant="primary"
        confirmVariant="tint"
        isConfirmFirst
      />
    </>
  );
}
