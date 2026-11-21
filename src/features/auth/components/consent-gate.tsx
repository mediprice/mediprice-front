'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import {
  consentHref,
  isConsentExemptPath,
  needsRequiredConsent,
} from '../required-consent';
import { useSession } from '../use-session';

/** 셸에 한 번 둔다. 내 정보가 필수 동의 누락을 알리면(로그인 중 약관이 바뀐 경우 등) 동의 화면으로 보내고, 그동안 화면을 가린다. 약관 문서는 읽을 수 있게 둔다. */
export function ConsentGate() {
  const t = useTranslations('auth.consent');
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();
  const isBlocked =
    needsRequiredConsent(user) && !isConsentExemptPath(pathname);

  useEffect(() => {
    if (!isBlocked) return;
    router.replace(consentHref(pathname + window.location.search));
  }, [isBlocked, pathname, router]);

  if (!isBlocked) return null;
  return (
    <div
      role="status"
      className="fixed inset-0 z-(--z-overlay) flex items-center justify-center bg-bg"
    >
      <span className="sr-only">{t('checking')}</span>
    </div>
  );
}
