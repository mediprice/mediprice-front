'use client';

import { useTranslations } from 'next-intl';
import { type ComponentProps, useState } from 'react';

import { Button } from '@/components/ui/button';

import { startGoogleLogin } from '../start-login';
import { GoogleMark } from './google-mark';

/** 페이지를 떠나는 동안 두 번 누르지 않게 로딩으로 바꾼다. */
export function GoogleLoginButton({
  returnTo = null,
  label,
  hasMark = true,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  returnTo?: string | null;
  label?: string;
  /** 색 면(primary) 위에서는 Google 로고를 빼서 브랜드 가이드를 지킨다. */
  hasMark?: boolean;
}) {
  const t = useTranslations('auth.loginDialog');
  const [isLeaving, setIsLeaving] = useState(false);
  return (
    <Button
      variant="outline"
      className={className}
      isLoading={isLeaving}
      onClick={() => {
        setIsLeaving(true);
        startGoogleLogin(returnTo);
      }}
      {...props}
    >
      {hasMark && <GoogleMark />}
      {label ?? t('google')}
    </Button>
  );
}
