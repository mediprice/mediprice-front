import type { ReactNode } from 'react';

import { PendingFact } from './pending-fact';

type FactRow = {
  label: string;
  /** null은 "운영자 확정 필요"로, false는 해당 없음이라 줄째 숨긴다. */
  value: ReactNode | null | false;
};

export function FactList({ title, rows }: { title?: string; rows: FactRow[] }) {
  const visible = rows.filter((row) => row.value !== false);
  return (
    <div className="max-w-prose rounded-xl bg-surface p-4 sm:p-5">
      {title && <h3 className="pb-2 text-subheading">{title}</h3>}
      <dl className="divide-y divide-border">
        {visible.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:gap-4"
          >
            <dt className="shrink-0 text-label text-text-secondary sm:w-36">
              {row.label}
            </dt>
            <dd className="min-w-0 text-body wrap-anywhere text-text-primary">
              {row.value ?? <PendingFact />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
