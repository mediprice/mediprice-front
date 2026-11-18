'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';

import { npayQueries } from '../queries';
import { PriceOverview } from './price-overview';

/** 홈 인기 항목 카드의 가격 영역. 기본 지역(서울·경기)의 평균과 범위를 보여 준다. */
export function PopularItemPrice({ code }: { code: string }) {
  const t = useTranslations('home.popular');
  const tRegion = useTranslations('common.region');
  const { data, isPending, isError } = useQuery(
    npayQueries.summaryIn(code, sidoCodesOf(DEFAULT_REGION)),
  );

  return (
    <div className="flex min-h-24 flex-col gap-1 bg-surface px-4 py-3.5 lg:px-6 lg:py-4">
      <p className="text-caption-strong text-text-tertiary">
        {t('priceLabel', { region: tRegion(DEFAULT_REGION) })}
      </p>
      {isPending ? (
        <span className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-44 lg:h-9" />
          <Skeleton className="h-4 w-full max-w-60" />
          <Skeleton className="h-4.75 w-52 max-w-full lg:h-5" />
        </span>
      ) : isError ? (
        <p className="text-body-sm text-text-tertiary">{t('error')}</p>
      ) : (
        <PriceOverview summary={data} />
      )}
    </div>
  );
}
