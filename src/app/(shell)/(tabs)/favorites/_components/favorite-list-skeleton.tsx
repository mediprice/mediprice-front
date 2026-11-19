import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

export function FavoriteListSkeleton() {
  const t = useTranslations('common.status');
  return (
    <div role="status" className="flex flex-col">
      <Skeleton className="mb-3 h-7 w-28" />
      <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-4 py-4">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-5 w-4/5" />
            </div>
            <Skeleton className="size-11 rounded-xl" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
