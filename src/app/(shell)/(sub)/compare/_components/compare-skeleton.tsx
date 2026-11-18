import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

export function CompareSkeleton({ columns }: { columns: number }) {
  const t = useTranslations('comparison.page');
  return (
    <div
      aria-busy="true"
      className="flex flex-col gap-4 rounded-xl border border-hairline p-4 lg:p-6"
    >
      <span className="sr-only">{t('loading')}</span>
      {Array.from({ length: 5 }, (_, row) => (
        <div key={row} className="flex gap-4">
          <Skeleton className="h-6 w-16 shrink-0 lg:w-36" />
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton
              key={column}
              className={row === 0 ? 'h-14 flex-1' : 'h-6 flex-1'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
