'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { PriceRange } from '@/components/ui/price-range';
import { Skeleton } from '@/components/ui/skeleton';

import { npayQueries } from '../queries';

/** 홈 인기 항목 카드의 가격 영역. 항목별 공개 가격 범위와 병원 수를 불러온다. */
export function PopularItemPrice({ code }: { code: string }) {
  const t = useTranslations('home.popular');
  const { data, isPending, isError } = useQuery(npayQueries.summary(code));

  return (
    <div className="flex flex-col gap-1 bg-surface px-4 py-3.5 lg:px-6 lg:py-4">
      <p className="text-caption-strong text-text-tertiary">
        {t('priceLabel')}
        {data && data.hospitalCount > 0 && (
          <span className="ml-1.5 text-caption">
            {t('hospitalCount', { count: data.hospitalCount })}
          </span>
        )}
      </p>
      {isPending ? (
        <Skeleton className="h-7 w-40" />
      ) : isError ? (
        <p className="text-body-sm text-text-tertiary">{t('error')}</p>
      ) : (
        <PriceRange
          min={data.minPrice}
          max={data.maxPrice}
          className="text-price-md"
        />
      )}
    </div>
  );
}
