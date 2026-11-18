'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { PriceRange } from '@/components/ui/price-range';
import { Skeleton } from '@/components/ui/skeleton';
import { npayQueries } from '@/features/npay/queries';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

import { type PriceFilters, toPriceCondition } from './price-filters';
import { useFilterLabels } from './use-filter-labels';

/** 현재 조건의 공개 가격 범위와 평균. 모바일은 머리 영역의 흰 카드, 데스크톱은 목록 위 회색 띠다. */
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
  const { data, isPending, isError, error, refetch } = useQuery(
    npayQueries.summary(code, toPriceCondition(filters)),
  );

  return (
    <div
      className={cn(
        'flex-col gap-3 rounded-xl bg-bg px-4.5 py-5 shadow-card lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:bg-surface lg:px-7 lg:py-6 lg:shadow-none',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-caption-strong text-text-secondary">
          {isPending ? (
            <Skeleton className="h-4.75 w-56 max-w-full" />
          ) : isError ? (
            t('label')
          ) : (
            t('basis', {
              scope,
              hospitals: data.hospitalCount,
              prices: data.priceCount,
            })
          )}
        </p>
        {isPending ? (
          <Skeleton className="h-9 w-60 max-w-full" />
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
          <p className="text-price-xl">
            <span className="sr-only">{t('label')}</span>
            <PriceRange min={data.minPrice} max={data.maxPrice} />
          </p>
        )}
      </div>
      {data?.avgPrice != null && (
        <p className="flex items-baseline gap-1.5 text-caption-strong text-text-secondary lg:flex-col lg:items-end lg:gap-0.5">
          {t('average')}
          <span className="text-label-bold text-text-primary tabular-nums lg:text-price-lg">
            {tPrice('won', { amount: data.avgPrice })}
          </span>
        </p>
      )}
    </div>
  );
}
