'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { CircleAlert, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { variantQuery } from '@/features/hospitals/detail-links';
import { HospitalPriceGroupCard } from '@/features/npay/components/hospital-price-group-card';
import { groupPricesByHospital } from '@/features/npay/group-prices';
import {
  buildPriceFiltersQuery,
  type PriceFilters,
} from '@/features/npay/price-filters';
import type { HospitalPrice } from '@/features/npay/price-stream';
import { npayQueries } from '@/features/npay/queries';
import { useRecordRecentItem } from '@/features/recent-items/use-recent-items';
import { errorMessageKey } from '@/lib/api/error-message';

import { ActiveFilterChips } from './active-filter-chips';
import { FilterSheet } from './filter-sheet';
import { formatItemTitle } from './item-title';
import { PriceScopeNotice } from './price-scope-notice';
import { SortMenu } from './sort-menu';
import { RESULTS_HEADING_ID } from './use-apply-filters';
import { useItemReady } from './use-item-ready';
import { useComparableSummary } from './use-price-summary';
import { ZeroResults } from './zero-results';

/** "더 보기"를 이만큼 읽은 뒤에도 남았으면 끝까지 넘기기보다 시·군·구로 좁히라고 안내한다. */
const NARROW_HINT_PAGES = 4;

/** 데스크톱은 필터 열이 옆에 있어 그 첫 칸으로 포커스를 옮긴다. */
function focusFilterColumn() {
  document
    .getElementById('item-filters-title')
    ?.closest('aside')
    ?.querySelector<HTMLElement>(
      'input:checked:not(:disabled), select:not(:disabled)',
    )
    ?.focus();
}

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
  const item = useQuery(npayQueries.detail(code));
  /** 다시 온 사람을 위해 이 기기에만 최근 본 항목을 남긴다(홈 검색창 아래 칩). */
  useRecordRecentItem(
    item.data ? { code, name: formatItemTitle(item.data) } : null,
  );
  /** 기본은 평균의 1/3~3배 가격만 받는다. 범위가 평균에서 나오므로 요약을 받은 뒤 목록을 읽고, 요약이 실패하면 범위 없이 읽는다. */
  const { summary, band, conditions, bandSummary } = useComparableSummary(
    code,
    filters,
  );
  const query = useInfiniteQuery({
    ...npayQueries.priceList(code, { conditions, sort: filters.sort }),
    enabled: isReady && (filters.prices === 'all' || !summary.isPending),
  });
  const groups = groupPricesByHospital(
    query.data?.pages.flatMap((page) => page.rows) ?? [],
  );
  const total = band
    ? bandSummary.data?.hospitalCount
    : summary.data?.hospitalCount;
  const excludedCount =
    band && summary.data && bandSummary.data
      ? summary.data.priceCount - bandSummary.data.priceCount
      : 0;
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

      {summary.isError && !query.isError && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-strong px-4 py-2 text-body-sm text-text-secondary">
          <p>{t('summaryFailed')}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void summary.refetch()}
          >
            {tActions('retry')}
          </Button>
        </div>
      )}
      {/** 빠진 가격 수는 범위 요약이 와야 알 수 있어, 그동안 안내 띠 자리를 잡아 목록이 밀리지 않게 한다. */}
      {band && bandSummary.isPending ? (
        <Skeleton className="h-16 rounded-lg lg:h-12" />
      ) : (
        <PriceScopeNotice
          code={code}
          filters={filters}
          excludedCount={excludedCount}
        />
      )}

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
          className="rounded-xl bg-bg shadow-card"
          action={
            <Button
              variant="tint"
              size="md"
              onClick={() => {
                if (summary.isError) void summary.refetch();
                void query.refetch();
              }}
            >
              {tActions('retry')}
            </Button>
          }
        />
      ) : groups.length === 0 && !query.hasNextPage ? (
        <ZeroResults code={code} filters={filters} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
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
            {query.hasNextPage &&
              !filters.sggu &&
              (query.data?.pages.length ?? 0) >= NARROW_HINT_PAGES && (
                <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg bg-primary-tint px-4 py-3 text-primary-text">
                  <p className="min-w-0 flex-[1_1_14rem] text-body-sm">
                    {t('narrowHint')}
                  </p>
                  <FilterSheet
                    code={code}
                    filters={filters}
                    trigger={
                      <Button variant="onTint" size="sm" className="lg:hidden">
                        <SlidersHorizontal aria-hidden="true" />
                        {t('narrowAction')}
                      </Button>
                    }
                  />
                  <Button
                    variant="onTint"
                    size="sm"
                    className="max-lg:hidden"
                    onClick={focusFilterColumn}
                  >
                    <SlidersHorizontal aria-hidden="true" />
                    {t('narrowAction')}
                  </Button>
                </div>
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
