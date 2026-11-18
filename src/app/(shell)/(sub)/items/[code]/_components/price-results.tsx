'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { HospitalPriceCard } from '@/features/npay/components/hospital-price-card';
import { npayQueries } from '@/features/npay/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { ActiveFilterChips } from './active-filter-chips';
import { type PriceFilters, toPriceCondition } from './price-filters';
import { SortControl } from './sort-control';
import { RESULTS_HEADING_ID } from './use-apply-filters';
import { ZeroResults } from './zero-results';

/** 결과 수·정렬과 병원별 가격 목록. "더 보기"로 20건씩 이어 붙인다. */
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
  const query = useInfiniteQuery(
    npayQueries.priceList(code, {
      condition: toPriceCondition(filters),
      sortCondition: { sort: filters.sort },
    }),
  );
  const rows = query.data?.pages.flatMap((page) => page.content) ?? [];
  const total = query.data?.pages[0]?.totalElements;

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
            className="text-label text-text-primary lg:text-heading"
          >
            {total !== undefined
              ? t('count', { count: total })
              : query.isPending && <Skeleton className="h-5.5 w-24 lg:h-7" />}
          </p>
          <div className="hidden flex-wrap gap-2 lg:flex">
            <ActiveFilterChips code={code} filters={filters} />
          </div>
        </div>
        <SortControl code={code} filters={filters} />
      </div>

      {query.isPending ? (
        <ul aria-busy="true" className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-xl bg-bg p-4 shadow-card lg:p-6"
            >
              <span className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-lg" />
                <span className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </span>
              </span>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-48" />
            </li>
          ))}
        </ul>
      ) : query.isError ? (
        <EmptyState
          icon={<CircleAlert />}
          title={tErrors(errorMessageKey(query.error))}
          className="rounded-xl bg-surface"
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
      ) : rows.length === 0 ? (
        <ZeroResults code={code} filters={filters} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {query.data.pages.map((page) =>
              page.content.map((price, index) => (
                <li key={`${page.page}-${index}`}>
                  <HospitalPriceCard price={price} itemCode={code} />
                </li>
              )),
            )}
          </ul>
          <div className="flex flex-col items-center gap-3 pt-2">
            {total !== undefined && (
              <p className="text-caption text-text-tertiary tabular-nums">
                {t('progress', { total, shown: rows.length })}
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
