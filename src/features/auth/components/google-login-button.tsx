'use client';

import { useTranslations } from 'next-intl';
import { type ComponentProps, useState } from 'react';

import { Button } from '@/components/ui/button';
import { startGoogleLogin } from '@/features/auth/start-login';

import { GoogleMark } from './google-mark';

/** 로그인 다이얼로그는 닫기(X)보다 로그인 버튼에 먼저 포커스를 둔다. Radix의 onOpenAutoFocus에 넘긴다. */
export function focusGoogleLogin(event: Event) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  const button = target.querySelector<HTMLElement>('[data-google-login]');
  if (!button) return;
  event.preventDefault();
  button.focus();
}

/** 페이지를 떠나는 동안 두 번 누르지 않게 로딩으로 바꾼다. */
export function GoogleLoginButton({
  returnTo = null,
  label,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  returnTo?: string | null;
  label?: string;
}) {
  const t = useTranslations('auth.loginDialog');
  const [isLeaving, setIsLeaving] = useState(false);
  return (
    <Button
      variant="outline"
      data-google-login=""
      className={className}
      isLoading={isLeaving}
      onClick={() => {
        setIsLeaving(true);
        startGoogleLogin(returnTo);
      }}
      {...props}
    >
      <GoogleMark />
      {label ?? t('google')}
    </Button>
  );
}
