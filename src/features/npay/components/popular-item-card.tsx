'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';

import { PriceOverview } from './price-overview';

/** 홈 HTML은 HOME_REVALIDATE_SECONDS(10분)마다 다시 만들어 서버가 채운 요약이 최대 10분쯤 지나 있다. 그보다 넉넉히 잡아 하이드레이션 직후 다시 읽지 않게 한다. */
const PREFETCHED_STALE_MS = 60 * 60 * 1000;

/** 홈 인기 항목 카드의 가격 영역. 기본 지역(서울·경기)의 평균과 범위를 보여 준다. */
export function PopularItemPrice({ code }: { code: string }) {
  const t = useTranslations('home.popular');
  const tRegion = useTranslations('common.region');
  const { data, isPending, isError } = useQuery({
    ...npayQueries.summaryIn(code, sidoCodesOf(DEFAULT_REGION)),
    staleTime: PREFETCHED_STALE_MS,
  });

  return (
    <div className="flex min-h-24 flex-col gap-1 bg-surface px-4 py-3.5 lg:px-6 lg:py-4">
      <p className="text-caption-strong text-text-tertiary">
        {t('priceLabel', { region: tRegion(DEFAULT_REGION) })}
      </p>
      {isPending ? (
        <span className="space-y-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </span>
      ) : isError ? (
        <p className="text-body-sm text-text-tertiary">{t('error')}</p>
      ) : (
        <PriceOverview summary={data} />
      )}
    </div>
  );
}
