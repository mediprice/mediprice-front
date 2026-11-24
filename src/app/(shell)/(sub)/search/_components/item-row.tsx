import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PriceOverview } from '@/features/npay/components/price-overview';
import { formatItemPath } from '@/features/npay/item-name';
import { npayQueries } from '@/features/npay/queries';
import {
  regionQuery,
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import type { ItemResult } from '@/features/search/queries';
import { cn } from '@/lib/utils';

import { PRICE_SLOT, PriceSkeleton } from './price-skeleton';

/** 가격이 있는 항목 한 줄. 요약은 목록 조회 때 캐시에 채워져 있어 바로 보인다. */
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
      className="group -mx-4 flex items-center gap-3 py-4 pr-2 pl-4 transition-colors hover:bg-surface active:bg-surface lg:-mx-6 lg:gap-6 lg:px-6 lg:py-5"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-subheading">
          {formatItemPath(item.name, item.mdivName)}
        </p>
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
      <ChevronRight
        aria-hidden="true"
        className="m-3 size-5 shrink-0 text-text-secondary lg:hidden"
        strokeWidth={1.75}
      />
      <span
        aria-hidden="true"
        className="hidden shrink-0 items-center gap-0.5 rounded-lg bg-primary-tint px-5 py-2.5 text-label-bold text-primary-text transition-colors group-hover:bg-primary-tint-hover lg:inline-flex"
      >
        {t('viewPrices')}
        <ChevronRight className="size-4" strokeWidth={2} />
      </span>
    </Link>
  );
}
