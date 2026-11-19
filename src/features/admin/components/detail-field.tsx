import type { ReactNode } from 'react';

/** 검토 다이얼로그의 이름–값 한 줄. dl 안에서 쓴다. */
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-body-sm text-text-secondary">{label}</dt>
      <dd className="min-w-0 text-body-sm wrap-anywhere">{children}</dd>
    </div>
  );
}
