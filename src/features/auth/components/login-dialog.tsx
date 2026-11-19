'use client';

import { Clock, ExternalLink, Heart, PenLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';

import { closeLoginDialog, useLoginDialogState } from '../login-dialog-store';
import { GoogleLoginButton } from './google-login-button';

/** 로그인 흐름(돌아올 경로)을 잃지 않도록 약관은 새 탭으로 연다. */
function newTabLink(href: '/terms' | '/privacy') {
  return function NewTabLink(chunks: ReactNode) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="text-primary-text underline underline-offset-4 hover:decoration-2"
      >
        {chunks}
        <ExternalLink
          aria-hidden="true"
          className="ml-0.5 inline size-3.5 align-middle"
          strokeWidth={2}
        />
      </a>
    );
  };
}

/** 셸에 하나만 렌더하고 openLoginDialog()로 연다. 헤더에서 직접 열면(general) 제목이 "로그인", 막힌 행동에서 열면 "로그인이 필요해요"다. */
export function LoginDialog() {
  const t = useTranslations('auth.loginDialog');
  const { isOpen, reason, returnTo, opener } = useLoginDialogState();
  const icon = { 'aria-hidden': true, strokeWidth: 1.75 } as const;
  const benefits = [
    { key: 'favorite', icon: <Heart {...icon} /> },
    { key: 'history', icon: <Clock {...icon} /> },
    { key: 'review', icon: <PenLine {...icon} /> },
  ] as const;

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginDialog();
      }}
    >
      <ResponsiveDialogContent
        title={reason === 'general' ? t('titleGeneral') : t('title')}
        className="md:max-w-md"
        onCloseAutoFocus={(event) => {
          if (!opener?.isConnected) return;
          event.preventDefault();
          opener.focus();
        }}
      >
        <div className="flex flex-col gap-5">
          <p className="text-body-lg text-text-secondary">
            {t(`reason.${reason}`)}
          </p>
          <section aria-labelledby="login-benefits">
            <h3
              id="login-benefits"
              className="pb-1 text-label-bold text-text-secondary"
            >
              {t('benefitsTitle')}
            </h3>
            <ul className="flex flex-col divide-y divide-hairline">
              {benefits.map((benefit) => (
                <li
                  key={benefit.key}
                  className="flex min-h-14 items-center gap-3 py-2.5 text-body text-text-primary"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary [&_svg]:size-4.5"
                  >
                    {benefit.icon}
                  </span>
                  {t(`benefits.${benefit.key}`)}
                </li>
              ))}
            </ul>
          </section>
          <GoogleLoginButton
            returnTo={returnTo}
            size="lg"
            className="min-h-14 w-full text-subheading"
          />
          <p className="text-body-sm text-text-secondary">
            {t.rich('terms', {
              terms: newTabLink('/terms'),
              privacy: newTabLink('/privacy'),
              newTab: (chunks) => <span className="sr-only">{chunks}</span>,
            })}
          </p>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
