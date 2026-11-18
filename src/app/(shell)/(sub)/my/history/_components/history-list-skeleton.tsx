import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

export function HistoryListSkeleton() {
  const t = useTranslations('common.status');
  return (
    <div role="status" className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-9 w-18 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-6 w-16" />
      <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-3 py-3.5">
            <Skeleton className="size-11 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
