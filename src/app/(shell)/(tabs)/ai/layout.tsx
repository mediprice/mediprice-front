import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** AI 대화는 개인 화면이라 검색에 노출하지 않는다. */
export const metadata: Metadata = { robots: { index: false } };

export default function AiLayout({ children }: { children: ReactNode }) {
  return children;
}
