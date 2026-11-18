'use client';

import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { RollingNumber } from '@/components/ui/rolling-number';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { npayQueries } from '@/features/npay/queries';
import {
  regionQuery,
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import { cn } from '@/lib/utils';

/** 홈 탭은 서비스 지역 셋만 둔다(전국은 검색 화면에서 고른다). */
const HOME_REGIONS = [
  'metro',
  'seoul',
  'gyeonggi',
] as const satisfies readonly ServiceRegion[];
type HomeRegion = (typeof HOME_REGIONS)[number];

/**
 * 순위는 POPULAR_ITEMS 순서다(실제 인기 순위 API가 생기면 바꾼다). 고른 지역의 요약만 요청하고,
 * 이미 연 지역은 React Query 캐시를 쓴다. 지역을 바꾸면 새 값이 올 때까지 이전 값을 흐리게 두고, 평균은 이전 값에서 새 값으로 굴러간다.
 * 범위는 값 점이 없는 막대 대신 "37만~495만원"처럼 짧은 글자로 쓴다(docs 14장).
 */
export function PopularItems() {
  const t = useTranslations('home.popular');
  const tRegion = useTranslations('common.region');
  const tActions = useTranslations('common.actions');
  const tPrice = useTranslations('common.price');
  const [region, setRegion] = useState<HomeRegion>('metro');
  const results = useQueries({
    queries: POPULAR_ITEMS.map((item) => ({
      ...npayQueries.summaryIn(item.code, sidoCodesOf(region)),
      placeholderData: keepPreviousData,
    })),
  });
  const failed = results.filter((result) => result.isError);

  return (
    <section aria-labelledby="home-popular">
      <PageContainer className="py-section">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            id="home-popular"
            title={t('title')}
            description={t('description')}
          />
          <span id="home-popular-region" className="sr-only">
            {t('regionLabel')}
          </span>
          <SegmentedControl
            name="home-popular-region"
            aria-labelledby="home-popular-region"
            value={region}
            onValueChange={setRegion}
            options={HOME_REGIONS.map((value) => ({
              value,
              label: tRegion(value),
            }))}
            className="w-full md:w-auto md:min-w-80"
          />
        </div>

        <ol className="mt-6 grid grid-cols-1 border-t border-hairline lg:mt-8 lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-12 lg:border-t-0 [&>li]:min-w-0">
          {POPULAR_ITEMS.map((item, index) => {
            const result = results[index];
            if (!result) return null;
            const summary = result.data;
            const average = summary?.avgPrice ?? null;
            const min = summary?.minPrice;
            const max = summary?.maxPrice;
            const spread =
              min != null && max != null && max > min ? { min, max } : null;
            return (
              <li
                key={item.id}
                aria-busy={result.isPlaceholderData || undefined}
                className={cn(
                  'border-b border-hairline transition-opacity duration-200 ease-standard lg:[&:nth-child(3n+1)]:border-t',
                  result.isPlaceholderData && 'opacity-60',
                )}
              >
                <Link
                  href={{
                    pathname: `/items/${item.code}`,
                    query: regionQuery(region),
                  }}
                  className="group flex min-h-24 items-center gap-3 rounded-xl py-4 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface-strong md:gap-4 md:px-2"
                >
                  <span className="w-8 shrink-0 text-center text-price-md text-text-tertiary group-hover:text-primary-text">
                    <span aria-hidden="true">{index + 1}</span>
                    <span className="sr-only">
                      {t('rank', { rank: index + 1 })}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className="flex min-w-20 flex-1 flex-col gap-0.5">
                      <span className="text-subheading">
                        {t(`items.${item.id}.name`)}
                      </span>
                      <span className="text-body-sm text-text-tertiary tabular-nums">
                        {result.isPending ? (
                          <Skeleton className="mt-0.5 h-5 w-16" />
                        ) : summary ? (
                          tPrice('hospitals', { count: summary.hospitalCount })
                        ) : null}
                      </span>
                    </span>
                    <span className="ml-auto flex max-w-full min-w-0 flex-col items-end gap-1.5">
                      {result.isPending ? (
                        <>
                          <Skeleton className="h-8 w-28" />
                          <Skeleton className="my-0.5 h-4.75 w-24 lg:h-5" />
                        </>
                      ) : result.isError ? (
                        <span className="text-body-sm text-text-tertiary">
                          {t('error')}
                        </span>
                      ) : average == null ? (
                        <span className="text-body-sm text-text-tertiary">
                          {tPrice('none')}
                        </span>
                      ) : (
                        <>
                          <span className="text-right text-price-lg [overflow-wrap:anywhere]">
                            <RollingNumber
                              value={average}
                              format={(value) =>
                                tPrice('won', { amount: value })
                              }
                            />
                          </span>
                          {spread && (
                            <span className="text-right text-body-sm text-text-secondary tabular-nums">
                              {tPrice('compactRange', spread)}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="hidden size-5 shrink-0 text-text-tertiary md:block"
                    strokeWidth={1.75}
                  />
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {failed.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p role="status" className="text-body-sm text-text-secondary">
                {t('errorAll')}
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  for (const result of failed) void result.refetch();
                }}
              >
                {tActions('retry')}
              </Button>
            </div>
          ) : (
            <span />
          )}
          <Link
            href={{ pathname: '/search', query: { category: 'all' } }}
            className="inline-flex min-h-11 items-center gap-1 text-label-bold text-primary-text hover:underline"
          >
            {t('viewAll')}
            <ChevronRight
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
          </Link>
        </div>
      </PageContainer>
    </section>
  );
}
