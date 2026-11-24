import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { env } from '@/env';
import { CLIENT_NAMESPACES, pickMessages } from '@/i18n/message-scope';

import { BRAND_COLORS } from './_components/brand-tile';
import { Providers } from './providers';

/** og:title·og:description은 비워 두어 공유 미리보기가 화면마다의 title·description을 쓰게 한다. og:image는 opengraph-image.tsx가 채운다. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    applicationName: t('title'),
    title: { default: t('title'), template: t('titleTemplate') },
    description: t('description'),
    openGraph: { type: 'website', siteName: t('title'), locale: 'ko_KR' },
    twitter: { card: 'summary_large_image' },
  };
}

export const viewport: Viewport = {
  themeColor: BRAND_COLORS.bg,
  colorScheme: 'light',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider
          messages={pickMessages(messages, CLIENT_NAMESPACES)}
        >
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
