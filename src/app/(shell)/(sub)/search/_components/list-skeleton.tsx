import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';

import { PriceSkeleton } from './item-row';

/** 첫 페이지를 불러오는 동안 목록 자리를 잡는다. 묶음 머리와 행은 실제 ItemRow·HospitalCard와 같은 높이다. */
export function ListSkeleton({
  rows = 5,
  variant = 'item',
}: {
  rows?: number;
  variant?: 'item' | 'hospital';
}) {
  const t = useTranslations('common.status');
  return (
    <div aria-busy="true" className="space-y-2 lg:space-y-3">
      <span className="sr-only">{t('loading')}</span>
      {variant === 'item' ? (
        <>
          <div className="flex min-h-6 items-center pt-2">
            <Skeleton className="h-4 w-40" />
          </div>
          <ul className="divide-y divide-hairline rounded-xl bg-bg px-4 lg:px-6 lg:shadow-card">
            {Array.from({ length: rows }, (_, index) => (
              <li key={index} className="space-y-1 py-4 lg:py-5">
                <Skeleton className="h-6 w-1/2" />
                <PriceSkeleton />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="space-y-3 lg:space-y-4">
          {Array.from({ length: rows }, (_, index) => (
            <li
              key={index}
              className="space-y-1 rounded-xl bg-bg p-4 shadow-card lg:p-6"
            >
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-5.75 w-1/3" />
              <Skeleton className="h-5.75 w-3/4" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
