import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminGate } from '@/features/admin/components/admin-gate';

import { AdminShell } from './_components/admin-shell';

/** 제목을 따로 주지 않아(사이트 기본 제목) 운영자가 아닌 방문자에게 화면이 있다는 것을 알리지 않는다. 검색에도 넣지 않는다. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 flex-col outline-none"
      >
        <AdminGate>
          <AdminShell>{children}</AdminShell>
        </AdminGate>
      </main>
    </div>
  );
}
