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
    <div aria-busy="true" className="space-y-1">
      <span className="sr-only">{t('loading')}</span>
      {variant === 'item' ? (
        <>
          <div className="flex min-h-6 items-center">
            <Skeleton className="h-4.5 w-40" />
          </div>
          <ul className="divide-y divide-hairline border-b border-hairline">
            {Array.from({ length: rows }, (_, index) => (
              <li key={index} className="flex items-center gap-3 py-5 lg:gap-8">
                <span className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:gap-8">
                  <Skeleton className="h-7 w-1/2 lg:flex-1" />
                  <span className="lg:w-72 lg:shrink-0">
                    <PriceSkeleton />
                  </span>
                </span>
                <Skeleton className="size-6 shrink-0" />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="divide-y divide-hairline border-y border-hairline">
          {Array.from({ length: rows }, (_, index) => (
            <li key={index} className="flex items-center gap-3 py-4 lg:py-5">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-5.75 w-1/3 lg:h-6" />
                <Skeleton className="h-5.75 w-3/4 lg:h-6" />
              </span>
              <Skeleton className="size-11 shrink-0 rounded-xl" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
