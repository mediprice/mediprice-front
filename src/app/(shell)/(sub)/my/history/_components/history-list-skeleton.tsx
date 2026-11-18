import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

export function HistoryListSkeleton() {
  const t = useTranslations('common.status');
  return (
    <div role="status" className="flex flex-col gap-3 lg:gap-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-9 w-16 rounded-full" />
        ))}
      </div>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-32 w-full rounded-xl lg:h-24" />
      ))}
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
