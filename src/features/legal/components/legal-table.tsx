import { useTranslations } from 'next-intl';
import { type ReactNode, useId } from 'react';

import { cn } from '@/lib/utils';

/** 좁은 화면에서는 표만 가로로 밀린다. 키보드로도 밀 수 있게 스크롤 영역에 포커스를 준다. */
export function LegalTable({
  caption,
  columns,
  rows,
  minWidth,
}: {
  caption: string;
  columns: string[];
  rows: ReactNode[][];
  /** 글이 긴 표. 좁은 화면에서 이 폭 아래로 줄이지 않고 가로 스크롤 안내를 보인다. */
  minWidth?: 'md' | 'lg';
}) {
  const t = useTranslations('legal.document');
  const captionId = useId();
  return (
    <div className="space-y-2">
      <div
        role="region"
        aria-labelledby={captionId}
        tabIndex={0}
        className="overflow-x-auto rounded-2xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <table
          className={cn(
            'w-full border-collapse text-left text-body-sm',
            minWidth === 'md' && 'min-w-2xl',
            minWidth === 'lg' && 'min-w-4xl',
          )}
        >
          <caption id={captionId} className="sr-only">
            {caption}
          </caption>
          <thead className="bg-surface">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 align-bottom text-label-bold text-text-secondary"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((cells, rowIndex) => (
              <tr key={rowIndex}>
                {cells.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th
                      key={cellIndex}
                      scope="row"
                      className="px-4 py-3 align-top text-label-bold text-text-primary"
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 align-top text-text-primary"
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {minWidth && (
        <p className="text-caption text-text-tertiary lg:hidden">
          {t('tableHint')}
        </p>
      )}
    </div>
  );
}
