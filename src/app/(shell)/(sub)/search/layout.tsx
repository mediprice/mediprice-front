import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ClientMessages } from '@/i18n/client-messages';

/** 검색 결과는 검색어마다 생기는 얇은 페이지라 검색에 노출하지 않는다(항목 페이지가 대신 노출된다). */
export const metadata: Metadata = { robots: { index: false } };

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <ClientMessages namespaces={['search', 'home.categories']}>
      {children}
    </ClientMessages>
  );
}
