'use client';

import { LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import type { LoginReason } from '../login-dialog-store';
import type { CurrentUser } from '../queries';
import { useSession } from '../use-session';
import { GoogleLoginButton } from './google-login-button';

/** 로그인한 사용자에게만 children을 보여 준다. 로그인하지 않았으면 이유와 로그인 버튼을, 확인 중에는 fallback을 보여 준다. */
export function LoginRequired({
  reason = 'general',
  fallback,
  children,
}: {
  reason?: LoginReason;
  /** 확인 중에 보일 자리. 기본은 회색 블록이다. */
  fallback?: ReactNode;
  children: ReactNode | ((user: CurrentUser) => ReactNode);
}) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { status, user, refetch } = useSession();

  if (status === 'pending') {
    return (
      fallback ?? (
        <div role="status">
          <Skeleton className="h-40 w-full rounded-xl" />
          <span className="sr-only">{t('account.checking')}</span>
        </div>
      )
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        icon={<LockKeyhole />}
        title={t('required.errorTitle')}
        action={
          <Button variant="tint" size="md" onClick={refetch}>
            {tCommon('actions.retry')}
          </Button>
        }
      />
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={<LockKeyhole />}
        title={t('loginDialog.title')}
        description={t(`loginDialog.reason.${reason}`)}
        action={<GoogleLoginButton variant="tint" size="md" />}
      />
    );
  }

  return typeof children === 'function' ? children(user) : children;
}
