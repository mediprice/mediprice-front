import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** 내 정보는 개인 화면이라 검색에 노출하지 않는다. */
export const metadata: Metadata = { robots: { index: false } };

export default function MyTabLayout({ children }: { children: ReactNode }) {
  return children;
}
