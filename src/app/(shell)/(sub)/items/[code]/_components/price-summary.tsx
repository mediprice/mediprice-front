'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { RangeBar } from '@/components/ui/range-bar';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessageKey } from '@/lib/api/error-message';

import type { PriceFilters } from './price-filters';
import { usePriceSummary } from './use-price-summary';

/**
 * 머리의 큰 평균과 최저–평균–최고 막대, 병원·가격 수. 극단값에 끌려가는 범위 대신 평균을 주인공으로 쓴다(docs 14장).
 * 데스크톱은 평균 옆에 막대를 둬서 폭을 쓴다. 불러오는 동안 같은 높이의 뼈대를 둔다.
 */
export function PriceSummary({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items');
  const tPrice = useTranslations('common.price');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const { data, isPending, isError, error, refetch } = usePriceSummary(
    code,
    filters,
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-12">
        <Skeleton className="h-12 w-56 lg:h-16 lg:w-72" />
        <div className="flex w-full max-w-xl flex-col gap-2 lg:max-w-lg lg:flex-1">
          <Skeleton className="h-15 w-full" />
          <Skeleton className="h-5.75 w-40 lg:h-6" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-wrap items-center gap-2" role="alert">
        <p className="text-body text-text-secondary">
          {tErrors(errorMessageKey(error))}
        </p>
        <Button variant="ghost" size="sm" onClick={() => void refetch()}>
          {tActions('retry')}
        </Button>
      </div>
    );
  }

  const counts = (
    <p className="text-body-sm text-text-secondary tabular-nums">
      {t('summary.counts', {
        hospitals: data.hospitalCount,
        prices: data.priceCount,
      })}
    </p>
  );

  if (data.avgPrice == null) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-heading text-text-tertiary">{t('header.noPrice')}</p>
        {counts}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-12">
      <p className="max-w-full text-price-hero">
        {/** 아주 큰 글자(200%)의 좁은 화면에서만 숫자가 줄을 넘겨 가로 스크롤이 생기지 않게 한다. */}
        <RollingNumber
          value={data.avgPrice}
          format={(value) => tPrice('won', { amount: value })}
          className="max-w-full wrap-anywhere"
        />
      </p>
      <div className="flex w-full max-w-xl flex-col gap-2 lg:max-w-lg lg:flex-1">
        <RangeBar
          min={data.minPrice}
          max={data.maxPrice}
          average={data.avgPrice}
          showAverageAmount={false}
        />
        {counts}
      </div>
    </div>
  );
}
