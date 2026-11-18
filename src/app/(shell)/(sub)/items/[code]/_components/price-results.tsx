'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { variantQuery } from '@/features/hospitals/detail-links';
import { HospitalPriceGroupCard } from '@/features/npay/components/hospital-price-group-card';
import { groupPricesByHospital } from '@/features/npay/group-prices';
import type { HospitalPrice } from '@/features/npay/price-stream';
import { npayQueries } from '@/features/npay/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { ActiveFilterChips } from './active-filter-chips';
import {
  buildPriceFiltersQuery,
  type PriceFilters,
  toPriceConditions,
} from './price-filters';
import { SortMenu } from './sort-menu';
import { RESULTS_HEADING_ID } from './use-apply-filters';
import { useItemReady } from './use-item-ready';
import { usePriceSummary } from './use-price-summary';
import { ZeroResults } from './zero-results';

/** 흰 바탕의 행 목록. 모바일은 화면 끝까지, 행 사이는 옅은 구분선이다. */
const LIST =
  '-mx-4 flex flex-col divide-y divide-hairline border-y border-hairline md:-mx-6';

/** 적용된 조건·정렬과 병원별 가격 행. "더 보기"로 읽은 행은 기존 병원 행에 합쳐진다. 병원 수는 머리에 크게 있어 여기서는 읽어 주기만 한다. */
export function PriceResults({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.list');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const isReady = useItemReady(code);
  const summary = usePriceSummary(code, filters);
  const query = useInfiniteQuery({
    ...npayQueries.priceList(code, {
      conditions: toPriceConditions(filters),
      sort: filters.sort,
    }),
    enabled: isReady,
  });
  const groups = groupPricesByHospital(
    query.data?.pages.flatMap((page) => page.rows) ?? [],
  );
  const total = summary.data?.hospitalCount;
  const backQuery = buildPriceFiltersQuery(filters);
  /** 행이 크게 보여 준 세부 항목을 넘겨, 병원 화면의 가격·평균 비교 문장이 그 행과 같은 세부 항목을 말하게 한다. */
  const hospitalQuery = (variant: HospitalPrice) =>
    new URLSearchParams({
      item: code,
      ...(backQuery && { back: backQuery }),
      ...(variant.itemName &&
        variantQuery({ name: variant.itemName, price: variant.price })),
    }).toString();

  return (
    <section
      aria-labelledby={RESULTS_HEADING_ID}
      className="flex flex-col gap-4"
    >
      <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2">
        <h2
          id={RESULTS_HEADING_ID}
          tabIndex={-1}
          className="text-heading text-text-primary"
        >
          {t('title')}
        </h2>
        <p aria-live="polite" className="sr-only">
          {total !== undefined && t('countStatus', { count: total })}
        </p>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <ActiveFilterChips code={code} filters={filters} />
        </div>
        <div className="hidden lg:block">
          <SortMenu code={code} filters={filters} />
        </div>
      </div>

      {query.isPending ? (
        <ul aria-busy="true" className={LIST}>
          {Array.from({ length: 4 }, (_, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 px-4 pt-5 pb-3 md:px-6 md:pt-6 md:pb-4"
            >
              <span className="flex items-start justify-between gap-4 md:gap-8">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <Skeleton className="h-6 w-40 max-w-full" />
                  <Skeleton className="h-5.75 w-28 lg:h-6" />
                </span>
                <Skeleton className="h-8 w-24" />
              </span>
              <span className="flex items-center justify-between gap-4 md:justify-end">
                <Skeleton className="h-6.5 w-36" />
                <Skeleton className="h-4 w-28 md:w-40" />
              </span>
              <span className="flex min-h-11 items-center gap-3">
                <Skeleton className="h-5.75 w-40 max-w-full lg:h-6" />
                <Skeleton className="ml-auto size-11 shrink-0 rounded-xl" />
                <Skeleton className="h-9 w-28 shrink-0 rounded-lg" />
              </span>
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <EmptyState
          icon={<CircleAlert />}
          title={tErrors(errorMessageKey(query.error))}
          action={
            <Button
              variant="tint"
              size="md"
              onClick={() => void query.refetch()}
            >
              {tActions('retry')}
            </Button>
          }
        />
      ) : groups.length === 0 && !query.hasNextPage ? (
        <ZeroResults code={code} filters={filters} />
      ) : (
        <>
          <ul className={LIST}>
            {groups.map((group, index) => (
              <li key={group.ykiho}>
                <HospitalPriceGroupCard
                  group={group}
                  hrefFor={(variant) =>
                    `/hospitals/${encodeURIComponent(group.ykiho)}?${hospitalQuery(variant)}`
                  }
                  summary={summary.data}
                  sort={filters.sort}
                  showAverageTick={index === 0}
                />
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-center gap-3 pt-2">
            {total !== undefined && (
              <p className="text-caption text-text-tertiary tabular-nums">
                {t('progress', {
                  total: Math.max(total, groups.length),
                  shown: groups.length,
                })}
              </p>
            )}
            {query.isFetchNextPageError && (
              <p role="alert" className="text-body-sm text-danger">
                {t('loadMoreError')}
              </p>
            )}
            {query.hasNextPage && (
              <Button
                variant="outline"
                size="md"
                className="w-full lg:w-auto lg:min-w-60"
                isLoading={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchNextPageError
                  ? tActions('retry')
                  : tActions('more')}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
