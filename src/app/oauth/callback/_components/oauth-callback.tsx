'use client';

import { CircleAlert, LoaderCircle } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
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
    <div className="flex w-full max-w-100 flex-col items-center gap-4 rounded-xl bg-bg px-6 py-10 text-center shadow-card">
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
    <div role="status" className="flex flex-col items-center gap-4">
      <LoaderCircle
        aria-hidden="true"
        data-allow-motion
        className="size-10 animate-spin text-primary"
        strokeWidth={2}
      />
      <h1 className="text-heading">{t('progressTitle')}</h1>
      <p className="text-body text-text-secondary">
        {t('progressDescription')}
      </p>
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
    <div role="alert" className="flex w-full flex-col items-center gap-4">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-danger-tint text-danger"
      >
        <CircleAlert className="size-7" strokeWidth={1.75} />
      </span>
      <h1 className="text-heading">
        {copy.kind === 'cancelled' ? t('cancelledTitle') : t('failedTitle')}
      </h1>
      <p className="text-body text-text-secondary">
        {copy.kind === 'cancelled'
          ? t('cancelledDescription')
          : tErrors(copy.messageKey)}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <GoogleLoginButton
          size="md"
          label={t('retry')}
          returnTo={returnTo}
          className="w-full"
        />
        <Button asChild variant="ghost" size="md" className="w-full">
          <Link href="/" replace>
            {t('home')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
