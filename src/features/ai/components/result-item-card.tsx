'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AreaScope } from '@/features/ai/area-filters';
import { isShownReason } from '@/features/ai/result-text';
import type { TurnItem } from '@/features/ai/schemas';
import { comparableBand } from '@/features/npay/average-verdict';
import { PriceOverview } from '@/features/npay/components/price-overview';
import { formatItemPath } from '@/features/npay/item-name';
import {
  buildPriceFiltersQuery,
  toPriceConditions,
} from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';
import { useCategoryLabel } from '@/features/npay/use-category-label';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import type { components } from '@/lib/api/schema';

import { NearbyMapPanel } from './nearby-map-panel';

type NpayItemDetail = components['schemas']['NpayItemDetailResponse'];

export type ItemDetail = Pick<
  NpayItemDetail,
  'code' | 'name' | 'mdivCode' | 'mdivName'
>;

/**
 * AI는 항목 코드와 고른 이유만 주고, 이름과 가격은 항상 공개 데이터 API에서 가져온다. 이름을 찾은 항목만 카드로 보여 준다.
 * 사용자가 장소를 말했으면(scope) 그 시도·시군구의 요약을 보여 주고, 병원별 가격 링크도 같은 조건으로 연다.
 */
export function ResultItemCard({
  item,
  detail,
  scope,
}: {
  item: TurnItem;
  detail: ItemDetail;
  scope: AreaScope;
}) {
  const t = useTranslations('ai.result');
  const tRegion = useTranslations('common.region');
  const categoryLabel = useCategoryLabel();
  const { filters } = scope;
  const hasSggu = Boolean(filters.sggu);
  const bySggu = useQuery({
    ...npayQueries.summaryOf(item.code, toPriceConditions(filters)),
    enabled: hasSggu,
  });
  const byRegion = useQuery({
    ...npayQueries.summaryIn(item.code, sidoCodesOf(filters.region)),
    enabled: !hasSggu,
  });
  const summary = hasSggu ? bySggu : byRegion;
  const regionLabel =
    scope.kind === 'area' ? scope.label : tRegion(filters.region);
  const query = buildPriceFiltersQuery(filters);

  const href =
    `/items/${encodeURIComponent(item.code)}${query ? `?${query}` : ''}` as const;
  const heading = (
    <>
      {detail.mdivName && (
        <p className="text-caption-strong text-primary-text">
          {categoryLabel(detail.mdivCode, detail.mdivName)}
        </p>
      )}
      <h3 className="text-heading">
        {formatItemPath(detail.name, detail.mdivName)}
      </h3>
      {isShownReason(item.reason) && (
        <p className="text-body-sm text-text-secondary">{item.reason}</p>
      )}
    </>
  );

  /** 장소를 알면 병원을 찾는 일이 먼저다: 지도와 주변 병원 목록을 크게 두고, 지역 평균은 한 줄로 줄인다. */
  if (scope.near) {
    const average = summary.data?.avgPrice;
    return (
      <article className="flex flex-col gap-4 rounded-xl bg-bg p-4 shadow-card lg:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="flex min-w-0 flex-col gap-1">{heading}</div>
          <div className="flex shrink-0 flex-col gap-0.5 md:items-end md:text-right">
            {summary.isPending ? (
              <Skeleton className="h-5 w-48" />
            ) : average != null && summary.data ? (
              <p className="text-body-sm text-text-secondary tabular-nums">
                {t('areaAverage', {
                  region: regionLabel,
                  amount: average,
                  count: summary.data.hospitalCount,
                })}
              </p>
            ) : null}
            <Link
              href={href}
              className="inline-flex min-h-11 items-center gap-1 rounded-md text-label text-primary-text hover:underline md:min-h-9"
            >
              {t('viewPrices')}
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
        {!summary.isPending && (
          <NearbyMapPanel
            code={item.code}
            itemName={formatItemPath(detail.name, detail.mdivName)}
            near={scope.near}
            band={comparableBand(summary.data?.avgPrice)}
          />
        )}
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl bg-bg p-4 shadow-card lg:p-5 xl:flex-row xl:items-end xl:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {heading}
        <div className="mt-2 flex flex-col gap-0.5">
          <p className="text-caption-strong text-text-tertiary">
            {scope.kind === 'default' && filters.region === DEFAULT_REGION
              ? t('priceLabelDefault', { region: regionLabel })
              : t('priceLabel', { region: regionLabel })}
          </p>
          {summary.isPending ? (
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-4 w-48" />
            </span>
          ) : summary.isError ? (
            <p className="text-body-sm text-text-tertiary">{t('priceError')}</p>
          ) : (
            <PriceOverview summary={summary.data} />
          )}
        </div>
      </div>
      <Button asChild variant="tint" size="md" className="w-full xl:w-auto">
        <Link href={href}>
          {t('viewPrices')}
          <ChevronRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
