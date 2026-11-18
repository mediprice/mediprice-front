'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { withdrawAccount } from '@/features/auth/queries';
import { signOut } from '@/features/auth/session';
import { errorMessageKey } from '@/lib/api/error-message';

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
      await signOut();
    },
  });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) withdraw.reset();
        onOpenChange(next);
      }}
      title={t('title')}
      description={t('description')}
      cancelLabel={tCommon('cancel')}
      confirmLabel={t('confirm')}
      onConfirm={() => withdraw.mutate()}
      isPending={withdraw.isPending}
      error={withdraw.isError ? tErrors(errorMessageKey(withdraw.error)) : null}
    />
  );
}
