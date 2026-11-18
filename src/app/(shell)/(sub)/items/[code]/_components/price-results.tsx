'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { HospitalPriceGroupCard } from '@/features/npay/components/hospital-price-group-card';
import { groupPricesByHospital } from '@/features/npay/group-prices';
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

/** 병원 수·적용된 조건·정렬과 병원별 가격 카드. "더 보기"로 읽은 행은 기존 병원 카드에 합쳐진다. */
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
  const hospitalQuery = new URLSearchParams({
    item: code,
    ...(backQuery && { back: backQuery }),
  }).toString();

  return (
    <section
      aria-labelledby={RESULTS_HEADING_ID}
      className="flex flex-col gap-3"
    >
      <h2 id={RESULTS_HEADING_ID} tabIndex={-1} className="sr-only">
        {t('title')}
      </h2>
      <div className="flex min-h-11 items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:gap-3">
          <p
            aria-live="polite"
            className="text-label-bold text-text-primary lg:text-heading"
          >
            {total !== undefined
              ? t('count', { count: total })
              : summary.isPending && <Skeleton className="h-5.5 w-24 lg:h-7" />}
          </p>
          <ActiveFilterChips code={code} filters={filters} />
        </div>
        <div className="hidden lg:block">
          <SortMenu code={code} filters={filters} />
        </div>
      </div>

      {query.isPending ? (
        <ul
          aria-busy="true"
          className="flex flex-col divide-y divide-hairline overflow-hidden rounded-2xl bg-bg"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <li
              key={index}
              className="flex items-start justify-between gap-4 px-4 pt-5 pb-4 md:px-6 md:pt-6 md:pb-5"
            >
              <span className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-2 h-6 w-48 max-w-full" />
              </span>
              <span className="flex flex-col items-end gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-24 md:w-36" />
              </span>
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <EmptyState
          icon={<CircleAlert />}
          title={tErrors(errorMessageKey(query.error))}
          className="rounded-2xl bg-bg"
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
          <ul className="flex flex-col divide-y divide-hairline overflow-hidden rounded-2xl bg-bg">
            {groups.map((group) => (
              <li key={group.ykiho}>
                <HospitalPriceGroupCard
                  group={group}
                  href={`/hospitals/${encodeURIComponent(group.ykiho)}?${hospitalQuery}`}
                  summary={summary.data}
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
