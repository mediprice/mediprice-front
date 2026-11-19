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

/** 로그인한 사용자에게만 children을 보여 준다. 로그인하지 않았으면 권하는 문장과 큰 로그인 버튼을, 확인 중에는 fallback을 보여 준다. */
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
          <Skeleton className="h-40 w-full rounded-2xl" />
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
        description={t('required.errorDescription')}
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
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-5 py-10 text-center lg:py-14">
        <span
          aria-hidden="true"
          className="mb-1 flex size-16 items-center justify-center rounded-2xl bg-bg text-primary [&_svg]:size-7"
        >
          <LockKeyhole strokeWidth={1.75} />
        </span>
        <p className="text-heading text-balance">
          {t(`required.invite.${reason}`)}
        </p>
        <p className="max-w-sm text-body text-balance text-text-secondary">
          {t('required.hint')}
        </p>
        <GoogleLoginButton
          size="lg"
          className="mt-3 min-h-14 w-full max-w-80 text-subheading"
        />
      </div>
    );
  }

  return typeof children === 'function' ? children(user) : children;
}
