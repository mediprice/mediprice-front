import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

/** 첫 페이지를 불러오는 동안 목록 자리를 잡는다. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  const t = useTranslations('common.status');
  return (
    <div aria-busy="true" className="space-y-2">
      <span className="sr-only">{t('loading')}</span>
      <Skeleton className="mt-2 h-5 w-40" />
      <ul className="divide-y divide-hairline rounded-xl bg-bg px-4 lg:px-6 lg:shadow-card">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="space-y-2 py-4 lg:py-5">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
