'use client';

import { CircleAlert, LoaderCircle } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  type CallbackOutcome,
  describeCallbackError,
  runOAuthCallbackOnce,
} from '@/features/auth/callback';
import { GoogleLoginButton } from '@/features/auth/components/google-login-button';

type Failure = Extract<CallbackOutcome, { status: 'error' }>;

export function OAuthCallback() {
  const router = useRouter();
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    let isActive = true;
    void runOAuthCallbackOnce().then((outcome) => {
      if (!isActive) return;
      /** returnTo는 sanitizeReturnPath를 거친 같은 출처의 경로다. */
      if (outcome.status === 'success')
        router.replace(outcome.returnTo as Route);
      else setFailure(outcome);
    });
    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <div className="w-full max-w-100">
      {failure ? (
        <CallbackFailure code={failure.code} returnTo={failure.returnTo} />
      ) : (
        <CallbackProgress />
      )}
    </div>
  );
}

function CallbackProgress() {
  const t = useTranslations('auth.callback');
  return (
    <div role="status">
      <EmptyState
        icon={<LoaderCircle data-allow-motion className="animate-spin" />}
        title={t('progressTitle')}
        description={t('progressDescription')}
      />
    </div>
  );
}

function CallbackFailure({
  code,
  returnTo,
}: {
  code: string;
  returnTo: string | null;
}) {
  const t = useTranslations('auth.callback');
  const tErrors = useTranslations('errors');
  const copy = describeCallbackError(code);
  return (
    <div role="alert">
      <EmptyState
        icon={<CircleAlert />}
        title={
          copy.kind === 'cancelled' ? t('cancelledTitle') : t('failedTitle')
        }
        description={
          copy.kind === 'cancelled'
            ? t('cancelledDescription')
            : tErrors(copy.messageKey)
        }
        action={
          <>
            <GoogleLoginButton
              variant="tint"
              size="md"
              label={t('retry')}
              returnTo={returnTo}
            />
            <Button asChild variant="ghost" size="md">
              {/** 로그인하려던 화면을 알면 그 화면으로, 모르면 홈으로 돌아간다. returnTo는 같은 출처 경로로 검증된 값이다. */}
              <Link href={(returnTo ?? '/') as Route} replace>
                {returnTo && returnTo !== '/' ? t('back') : t('home')}
              </Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
