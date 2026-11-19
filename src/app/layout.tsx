import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Providers } from './providers';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: { default: t('title'), template: t('titleTemplate') },
    description: t('description'),
  };
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
