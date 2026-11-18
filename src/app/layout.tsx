import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'MediPrice',
  description: 'MediPrice 프론트엔드',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
