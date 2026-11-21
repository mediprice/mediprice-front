'use client';

import { useMutation } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { CenteredDialogContent } from '@/features/auth/components/centered-dialog-content';
import { withdrawAccount } from '@/features/auth/queries';
import { signOut } from '@/features/auth/session';
import { showToast } from '@/features/feedback/toast-store';
import { errorMessageKey } from '@/lib/api/error-message';

/** 후기는 지우지 않고 작성자 정보만 떼어 남긴다(백엔드 탈퇴 동작). */
const DELETED_ITEMS = ['medicalProfile', 'favorites', 'history'] as const;

export function WithdrawDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('mypage.withdraw');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common.actions');
  const router = useRouter();
  const withdraw = useMutation({
    /** 이 화면이 "로그인 필요"로 바뀌어 보이지 않게 먼저 홈으로 옮긴 뒤 쿠키와 캐시를 지운다. */
    mutationFn: async () => {
      await withdrawAccount();
      router.replace('/');
      showToast(t('done'));
      await signOut();
    },
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (withdraw.isPending) return;
        if (!next) withdraw.reset();
        onOpenChange(next);
      }}
    >
      <CenteredDialogContent title={t('title')}>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-warning-tint p-4">
            <p className="flex items-center gap-2 text-label-bold text-text-primary">
              <TriangleAlert
                aria-hidden="true"
                className="size-5 shrink-0 text-warning"
                strokeWidth={1.75}
              />
              {t('deletedTitle')}
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-12 text-body-sm text-text-secondary">
              {DELETED_ITEMS.map((item) => (
                <li key={item}>{t(`items.${item}`)}</li>
              ))}
            </ul>
            <p className="mt-3 text-body-sm text-text-secondary">
              {t('reviewsKept')}
            </p>
          </div>
          <p className="text-body-sm text-text-secondary">{t('note')}</p>
          {withdraw.isError && (
            <p role="alert" className="text-body-sm text-danger">
              {tErrors(errorMessageKey(withdraw.error))}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="neutral"
              size="md"
              disabled={withdraw.isPending}
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={withdraw.isPending}
              onClick={() => withdraw.mutate()}
            >
              {t('confirm')}
            </Button>
          </div>
        </div>
      </CenteredDialogContent>
    </ResponsiveDialog>
  );
}
