'use client';

import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import errors from '@/i18n/messages/ko/errors.json';

/** 루트 레이아웃 자체가 실패하면 NextIntlClientProvider도 없으므로 errors 문구만 직접 읽는다. */
const t = createTranslator({
  locale: 'ko',
  messages: { errors },
  namespace: 'errors.page.global',
});

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <title>{t('title')}</title>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-page text-center">
          <h1 className="text-heading text-balance">{t('title')}</h1>
          <p className="max-w-sm text-body text-balance text-text-secondary">
            {t('description')}
          </p>
          <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
            <Button variant="tint" size="md" onClick={retry}>
              {t('retry')}
            </Button>
            <Button asChild variant="ghost" size="md">
              <Link href="/">{t('home')}</Link>
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
