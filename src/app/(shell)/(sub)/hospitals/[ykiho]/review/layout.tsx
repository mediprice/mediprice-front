import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** 후기 쓰기는 로그인한 사용자의 입력 화면이라 검색에 노출하지 않는다. */
export const metadata: Metadata = { robots: { index: false } };

export default function ReviewWriteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
