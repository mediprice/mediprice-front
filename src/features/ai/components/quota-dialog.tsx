'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { CenteredDialogContent } from '@/features/auth/components/centered-dialog-content';
import { openLoginDialog } from '@/features/auth/login-dialog-store';

/** 하루 한도를 다 썼을 때. 비회원은 로그인으로, 회원은 일반 검색으로 안내한다. */
export function QuotaDialog({
  open,
  onOpenChange,
  isMember,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMember: boolean;
  /** 열게 한 입력창이 막혀 있어 닫힐 때 포커스를 돌려줄 곳을 화면이 정한다. */
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations('ai.quota');
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <CenteredDialogContent
        title={t('title')}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <div className="flex flex-col gap-5">
          <p className="text-body text-text-secondary">
            {isMember ? t('member') : t('anonymous')}
          </p>
          <div className="flex flex-col gap-1">
            {!isMember && (
              <Button
                variant="tint"
                size="md"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  openLoginDialog({ reason: 'ai' });
                }}
              >
                {t('login')}
              </Button>
            )}
            <Button
              asChild
              variant={isMember ? 'tint' : 'ghost'}
              size="md"
              className="w-full"
            >
              <Link href="/search">{t('search')}</Link>
            </Button>
          </div>
        </div>
      </CenteredDialogContent>
    </ResponsiveDialog>
  );
}
