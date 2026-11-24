'use client';

import { useTranslations } from 'next-intl';

import { RollingNumber } from '@/components/ui/rolling-number';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceSpread } from '@/features/npay/components/price-spread';
import type { PriceFilters } from '@/features/npay/price-filters';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

import { useFilterLabels } from './use-filter-labels';
import { useComparableSummary } from './use-price-summary';

/**
 * 현재 조건의 평균을 크게, 세부 항목별 최저~최고(글자)와 병원·가격 수를 작게 보여 준다(극단값을 머리로 쓰지 않는다, docs 14장).
 * 모바일은 머리 띠, 데스크톱은 회색 목록 띠 위의 흰 카드다.
 */
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
  const { scope } = useFilterLabels(filters);
  const { summary, band, bandSummary } = useComparableSummary(code, filters);
  const { data, isPending, isError, error } = summary;
  /** 평균은 전체 가격 기준(범위를 정하는 기준)이고, 범위·병원 수는 목록과 같은 "견줄 수 있는 가격" 기준이다. */
  const spread = band ? bandSummary.data : data;
  const isSpreadPending = isPending || (band !== null && bandSummary.isPending);

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
          /** 다시 시도는 아래 목록 쪽 하나로 모은다(같은 원인으로 버튼이 두 개 생기지 않게). */
          <p className="text-body-sm text-text-secondary">
            {tErrors(errorMessageKey(error))}
          </p>
        ) : data.avgPrice == null ? (
          <p className="text-price-xl text-text-tertiary">{tPrice('none')}</p>
        ) : (
          <p className="max-w-full text-price-xl">
            {/** 아주 큰 글자의 좁은 화면에서만 숫자가 줄을 넘겨 가로 스크롤이 생기지 않게 한다. */}
            <RollingNumber
              value={data.avgPrice}
              format={(value) => tPrice('average', { amount: value })}
              className="max-w-full wrap-anywhere"
            />
          </p>
        )}
      </div>
      {isSpreadPending ? (
        <Skeleton className="h-11 w-56 max-w-full" />
      ) : (
        spread && (
          <div className="flex min-w-0 flex-col gap-0.5 text-body-sm tabular-nums md:items-end md:text-right">
            <PriceSpread min={spread.minPrice} max={spread.maxPrice} />
            <p className="text-text-tertiary">
              {t(band ? 'comparableCounts' : 'counts', {
                hospitals: spread.hospitalCount,
                prices: spread.priceCount,
              })}
            </p>
          </div>
        )
      )}
    </div>
  );
}
