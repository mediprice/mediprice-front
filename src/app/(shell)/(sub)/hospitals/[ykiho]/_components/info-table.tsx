import type { ReactNode } from 'react';

/** 라벨·값 두 칸 표(Figma 시간표·정보표). 값이 없는 행은 호출하는 쪽이 뺀다. */
export function InfoTable({
  rows,
}: {
  rows: { key: string; label: ReactNode; value: ReactNode }[];
}) {
  return (
    <dl className="flex flex-col rounded-xl bg-surface px-5 py-1.5 lg:px-6">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-start justify-between gap-4 border-b border-border py-3.5 last:border-b-0"
        >
          <dt className="shrink-0 text-label text-text-secondary">
            {row.label}
          </dt>
          <dd className="min-w-0 text-right text-label-bold text-text-primary">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
