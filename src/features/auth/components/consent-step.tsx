'use client';

import { CircleAlert, LoaderCircle } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

import { needsRequiredConsent } from '../required-consent';
import { signOut } from '../session';
import { useSession } from '../use-session';
import { RequiredConsentForm } from './required-consent-form';

/** 로그인 직후나 약관이 바뀐 뒤 필수 동의를 받는 화면. 동의가 필요 없으면(동의를 마쳤거나, 로그인하지 않았거나, 동의를 모르는 예전 백엔드) 돌아갈 경로로 보낸다. */
export function ConsentStep({ returnTo }: { returnTo: string }) {
  const t = useTranslations('auth.consent');
  const tRequired = useTranslations('auth.required');
  const tCommon = useTranslations('common.actions');
  const router = useRouter();
  const { status, user, refetch } = useSession();
  const needsConsent = needsRequiredConsent(user);
  const isLeaving = useRef(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const shouldLeave =
    status === 'anonymous' || (status === 'authenticated' && !needsConsent);

  useEffect(() => {
    if (!shouldLeave || isLeaving.current) return;
    isLeaving.current = true;
    /** returnTo는 consentReturnPath를 거친 같은 출처의 경로다. */
    router.replace(returnTo as Route);
  }, [shouldLeave, returnTo, router]);

  async function decline() {
    isLeaving.current = true;
    setIsSigningOut(true);
    router.replace('/');
    await signOut();
  }

  if (status === 'error') {
    return (
      <div role="alert">
        <EmptyState
          icon={<CircleAlert />}
          title={tRequired('errorTitle')}
          description={tRequired('errorDescription')}
          action={
            <Button variant="tint" size="md" onClick={refetch}>
              {tCommon('retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (status !== 'authenticated' || !needsConsent) {
    return (
      <div role="status">
        <EmptyState
          icon={<LoaderCircle data-allow-motion className="animate-spin" />}
          title={shouldLeave ? t('done') : t('checking')}
        />
      </div>
    );
  }

  return (
    <>
      <RequiredConsentForm onDecline={() => setIsDeclining(true)} />
      <ConfirmDialog
        open={isDeclining}
        onOpenChange={setIsDeclining}
        title={t('declineDialog.title')}
        description={t('declineDialog.description')}
        cancelLabel={tCommon('cancel')}
        confirmLabel={t('declineDialog.confirm')}
        confirmVariant="primary"
        onConfirm={() => void decline()}
        isPending={isSigningOut}
      />
    </>
  );
}
