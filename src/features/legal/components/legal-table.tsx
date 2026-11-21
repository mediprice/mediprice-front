import { type ReactNode, useId } from 'react';

import { cn } from '@/lib/utils';

/**
 * 법적 문서의 표. 좁은 화면에서는 칸이 넘쳐 잘리지 않게 행마다 카드(dl)로 풀어 쓰고, 표가 들어갈 폭부터 표로 보인다.
 * 둘 중 하나만 화면에 나오므로(display) 낭독기도 한 번만 읽는다.
 */
export function LegalTable({
  caption,
  columns,
  rows,
  minWidth,
}: {
  caption: string;
  columns: string[];
  rows: ReactNode[][];
  /** 글이 긴 표. 이 폭(md 672px, lg 896px)이 들어가는 화면부터 표로 보인다. 없으면 md부터 표다. */
  minWidth?: 'md' | 'lg';
}) {
  const captionId = useId();
  const isWide = minWidth === 'lg';
  return (
    <div>
      <ul
        aria-label={caption}
        className={cn('space-y-3', isWide ? 'lg:hidden' : 'md:hidden')}
      >
        {rows.map((cells, rowIndex) => (
          <li key={rowIndex} className="rounded-xl bg-surface p-4">
            <dl className="space-y-3">
              {cells.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <div key={cellIndex}>
                    <dt className="sr-only">{columns[0]}</dt>
                    <dd className="text-subheading text-text-primary">
                      {cell}
                    </dd>
                  </div>
                ) : (
                  <div key={cellIndex} className="space-y-0.5">
                    <dt className="text-label text-text-secondary">
                      {columns[cellIndex]}
                    </dt>
                    <dd className="text-body-sm wrap-anywhere text-text-primary">
                      {cell}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </li>
        ))}
      </ul>
      <div
        role="region"
        aria-labelledby={captionId}
        tabIndex={0}
        className={cn(
          'hidden overflow-x-auto rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          isWide ? 'lg:block' : 'md:block',
        )}
      >
        <table
          className={cn(
            'w-full border-collapse text-left text-body-sm',
            minWidth === 'md' && 'min-w-2xl',
            isWide && 'min-w-4xl',
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
    </div>
  );
}
