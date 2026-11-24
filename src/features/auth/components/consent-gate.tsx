'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { sessionKeys } from '@/features/auth/queries';
import {
  consentHref,
  isConsentExemptPath,
  needsRequiredConsent,
} from '@/features/auth/required-consent';
import { useSession } from '@/features/auth/use-session';
import { subscribeRequiredConsentsMissing } from '@/lib/api/session-events';

/**
 * 셸에 한 번 둔다. 내 정보가 필수 동의 누락을 알리면(로그인 중 약관이 바뀐 경우 등) 동의 화면으로 보내고, 그동안 화면을 가린다. 약관 문서는 읽을 수 있게 둔다.
 * 쓰기 요청이 필수 동의 누락(403)으로 거부되면 내 정보를 다시 받아 같은 흐름으로 보낸다.
 */
export function ConsentGate() {
  const t = useTranslations('auth.consent');
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { user } = useSession();
  const isBlocked =
    needsRequiredConsent(user) && !isConsentExemptPath(pathname);

  useEffect(
    () =>
      subscribeRequiredConsentsMissing(() => {
        void queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
      }),
    [queryClient],
  );

  useEffect(() => {
    if (!isBlocked) return;
    router.replace(consentHref(pathname + window.location.search));
  }, [isBlocked, pathname, router]);

  if (!isBlocked) return null;
  return (
    <div
      role="status"
      className="fixed inset-0 z-(--z-overlay) flex flex-col items-center justify-center gap-3 bg-bg px-page text-center"
    >
      <LoaderCircle
        aria-hidden="true"
        data-allow-motion
        className="size-8 animate-spin text-primary"
        strokeWidth={1.75}
      />
      <p className="text-body text-text-secondary">{t('checking')}</p>
    </div>
  );
}
