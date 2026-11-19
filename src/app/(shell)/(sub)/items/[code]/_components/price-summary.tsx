'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

import type { PriceFilters } from './price-filters';
import { useFilterLabels } from './use-filter-labels';
import { usePriceSummary } from './use-price-summary';

/** 현재 조건의 평균을 크게, 최저·최고와 병원·가격 수를 작게 보여 준다(극단값을 머리로 쓰지 않는다). 모바일은 머리 띠, 데스크톱은 회색 목록 띠 위의 흰 카드다. */
export function PriceSummary({
  code,
  filters,
  className,
}: {
  code: string;
  filters: PriceFilters;
  className?: string;
}) {
  const t = useTranslations('items.summary');
  const tPrice = useTranslations('common.price');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const { scope } = useFilterLabels(filters);
  const { data, isPending, isError, error, refetch } = usePriceSummary(
    code,
    filters,
  );

  return (
    <div
      className={cn(
        'flex-col gap-3 rounded-xl bg-bg px-4.5 py-5 shadow-card md:flex-row md:items-end md:justify-between md:gap-6 lg:px-7 lg:py-6',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-caption-strong text-text-secondary">
          {t('scope', { scope })}
        </p>
        {isPending ? (
          <Skeleton className="h-9 w-52 max-w-full" />
        ) : isError ? (
          <div className="flex flex-wrap items-center gap-2" role="alert">
            <p className="text-body-sm text-text-secondary">
              {tErrors(errorMessageKey(error))}
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              {tActions('retry')}
            </Button>
          </div>
        ) : (
          <p
            className={cn(
              'text-price-xl tabular-nums',
              data.avgPrice == null && 'text-text-tertiary',
            )}
          >
            {data.avgPrice == null
              ? tPrice('none')
              : tPrice('average', { amount: data.avgPrice })}
          </p>
        )}
      </div>
      {isPending ? (
        <Skeleton className="h-11 w-56 max-w-full" />
      ) : (
        data && (
          <div className="flex flex-col gap-0.5 text-body-sm tabular-nums md:items-end md:text-right">
            {data.minPrice != null && data.maxPrice != null && (
              <p className="text-text-secondary">
                {tPrice('minMax', { min: data.minPrice, max: data.maxPrice })}
              </p>
            )}
            <p className="text-text-tertiary">
              {t('counts', {
                hospitals: data.hospitalCount,
                prices: data.priceCount,
              })}
            </p>
          </div>
        )
      )}
    </div>
  );
}
