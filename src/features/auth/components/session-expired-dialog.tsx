'use client';

import { useTranslations } from 'next-intl';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';

import { CenteredDialogContent } from './centered-dialog-content';
import { GoogleLoginButton } from './google-login-button';

/** Refresh까지 거부돼 로그인이 끝났을 때. 로그인하면 지금 화면으로 돌아온다. */
export function SessionExpiredDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('auth.expired');
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <CenteredDialogContent title={t('title')}>
        <div className="flex flex-col gap-5">
          <p className="text-body text-text-secondary">{t('description')}</p>
          <GoogleLoginButton
            size="lg"
            className="min-h-14 w-full text-subheading"
          />
        </div>
      </CenteredDialogContent>
    </ResponsiveDialog>
  );
}
