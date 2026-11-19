'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceSpread } from '@/features/npay/components/price-spread';
import type { PriceFilters } from '@/features/npay/price-filters';
import { errorMessageKey } from '@/lib/api/error-message';

import { usePriceSummary } from './use-price-summary';

/**
 * 머리의 큰 평균과 세부 항목별 최저~최고(글자), 병원·가격 수. 극단값에 끌려가는 범위 대신 평균을 주인공으로 쓴다(docs 14장).
 * 이 병원 점이 없는 범위 막대는 정보가 없어 쓰지 않는다. 불러오는 동안 같은 높이의 뼈대를 둔다.
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
      <div className="@container flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-10">
        <Skeleton className="h-12 w-56 lg:h-16 lg:w-72" />
        <div className="flex flex-col gap-1 lg:pb-2">
          <Skeleton className="my-0.5 h-4.75 w-72 max-w-full lg:h-5" />
          <Skeleton className="my-0.5 h-4.75 w-40 lg:h-5" />
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
    <div className="@container flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-10">
      <p className="max-w-full text-price-hero">
        {/** 글자 크기가 컨테이너 폭에 맞춰 줄어든다(text-price-hero). 그래도 넘치는 아주 긴 금액만 줄을 넘긴다. */}
        <RollingNumber
          value={data.avgPrice}
          format={(value) => tPrice('won', { amount: value })}
          className="max-w-full wrap-anywhere"
        />
      </p>
      <div className="flex flex-col gap-1 lg:pb-2">
        <PriceSpread min={data.minPrice} max={data.maxPrice} />
        {counts}
      </div>
    </div>
  );
}
