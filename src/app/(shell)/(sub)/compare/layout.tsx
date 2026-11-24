import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ClientMessages } from '@/i18n/client-messages';

/** 비교표는 사용자가 고른 조합이라 검색에 노출하지 않는다. */
export const metadata: Metadata = { robots: { index: false } };

export default function CompareLayout({ children }: { children: ReactNode }) {
  return (
    <ClientMessages namespaces={['comparison', 'metadata']}>
      {children}
    </ClientMessages>
  );
}
