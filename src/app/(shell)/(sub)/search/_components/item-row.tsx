import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { PriceOverview } from '@/features/npay/components/price-overview';
import { npayQueries } from '@/features/npay/queries';
import {
  regionQuery,
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import { formatItemName } from '@/features/search/item-groups';
import type { ItemResult } from '@/features/search/queries';
import { cn } from '@/lib/utils';

/** 가격 영역 높이(평균 + 최저~최고 글자 + 병원 수). 상태가 바뀌어도 행 높이가 같게 둔다. */
const PRICE_SLOT = 'min-h-23 lg:min-h-24';

/** 가격이 있는 항목 한 줄. 모바일은 이름 아래, lg부터 오른쪽 열에 평균·최저~최고·병원 수를 둔다. 요약은 목록 조회 때 캐시에 채워져 있어 바로 보인다. */
export function ItemRow({
  item,
  region,
}: {
  item: ItemResult;
  region: ServiceRegion;
}) {
  const t = useTranslations('search.item');
  const summary = useQuery(
    npayQueries.summaryIn(item.code, sidoCodesOf(region)),
  );

  return (
    <Link
      href={{ pathname: `/items/${item.code}`, query: regionQuery(region) }}
      className="group -mx-4 flex items-center gap-3 px-4 py-5 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface lg:gap-8"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:gap-8">
        <p className="text-heading group-hover:text-primary-text lg:flex-1">
          {formatItemName(item)}
        </p>
        <div className="lg:w-72 lg:shrink-0">
          {summary.data ? (
            <PriceOverview summary={summary.data} className={PRICE_SLOT} />
          ) : summary.isError ? (
            <p className={cn('text-body-sm text-text-tertiary', PRICE_SLOT)}>
              {t('priceError')}
            </p>
          ) : (
            <PriceSkeleton />
          )}
        </div>
      </div>
      <ChevronRight
        aria-hidden="true"
        className="size-6 shrink-0 text-text-tertiary transition-transform duration-200 ease-standard group-hover:translate-x-0.5 group-hover:text-primary-text"
        strokeWidth={1.75}
      />
    </Link>
  );
}

/** PriceOverview(md)와 같은 높이를 차지한다. */
export function PriceSkeleton() {
  return (
    <div className={cn('flex flex-col gap-1', PRICE_SLOT)}>
      <Skeleton className="h-8 w-40 lg:h-9" />
      <Skeleton className="my-0.5 h-4.75 w-60 max-w-full lg:h-5" />
      <Skeleton className="my-0.5 h-4.75 w-20 lg:h-5" />
    </div>
  );
}
