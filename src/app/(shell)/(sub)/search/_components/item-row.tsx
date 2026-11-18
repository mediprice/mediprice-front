import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PriceRange } from '@/components/ui/price-range';
import { Skeleton } from '@/components/ui/skeleton';
import { npayQueries } from '@/features/npay/queries';
import { formatItemName } from '@/features/search/item-groups';
import {
  type Region,
  regionSidoCode,
  withRegion,
} from '@/features/search/search-params';
import type { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';

import { useInView } from './use-in-view';

type NpayItem = components['schemas']['NpayItemResponse'];

/** 항목 한 줄. 가격 범위는 행이 화면 근처에 왔을 때 지역 조건으로 따로 불러온다(항목마다 요청 하나). */
export function ItemRow({ item, region }: { item: NpayItem; region: Region }) {
  const t = useTranslations('search.item');
  const [ref, isInView] = useInView<HTMLAnchorElement>();
  const summary = useQuery({
    ...npayQueries.summary(item.code, { sidoCode: regionSidoCode(region) }),
    enabled: isInView,
  });
  const hasNoPrice = summary.data?.hospitalCount === 0;

  return (
    <Link
      ref={ref}
      href={{
        pathname: `/items/${item.code}`,
        query: withRegion({}, region),
      }}
      className="group -mx-4 flex items-center gap-3 py-4 pr-2 pl-4 transition-colors hover:bg-surface active:bg-surface lg:-mx-6 lg:gap-6 lg:px-6 lg:py-5"
    >
      <span className="min-w-0 flex-1 space-y-1">
        <span
          className={cn(
            'block text-subheading',
            hasNoPrice && 'text-text-tertiary',
          )}
        >
          {formatItemName(item)}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-text-secondary">
          {summary.isPending ? (
            <Skeleton className="h-5 w-44" />
          ) : summary.isError ? (
            t('priceError')
          ) : hasNoPrice ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-strong px-2 py-0.5 text-caption">
              <Info aria-hidden="true" className="size-3" strokeWidth={1.5} />
              {t('noPrice')}
            </span>
          ) : (
            <>
              <span>{t('priceLabel')}</span>
              <PriceRange
                min={summary.data.minPrice}
                max={summary.data.maxPrice}
                className="text-label-bold text-text-primary"
              />
              <span className="text-text-tertiary">
                {t('hospitalCount', { count: summary.data.hospitalCount })}
              </span>
            </>
          )}
        </span>
      </span>
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
