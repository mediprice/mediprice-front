import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

export function FavoriteListSkeleton() {
  const t = useTranslations('common.status');
  return (
    <div role="status" className="flex flex-col gap-3 lg:gap-4">
      <Skeleton className="h-6 w-24" />
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-24 w-full rounded-xl lg:h-28" />
      ))}
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
