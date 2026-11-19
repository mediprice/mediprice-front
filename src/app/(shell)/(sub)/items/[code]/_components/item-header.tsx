'use client';

import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from '@/components/ui/tag';
import { type PriceFilters, withRegion } from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';
import { useCategoryLabel } from '@/features/npay/use-category-label';
import {
  regionQuery,
  SERVICE_REGIONS,
} from '@/features/regions/service-region';
import { errorMessageKey } from '@/lib/api/error-message';

import { formatItemTitle } from './item-title';
import { PriceSummary } from './price-summary';
import { useApplyFilters } from './use-apply-filters';
import { useFilterLabels } from './use-filter-labels';

/**
 * 흰 머리. "도수치료, 서울·경기 평균" 문장 제목 아래에 평균을 크게 굴려 올리고 범위 막대와 병원 수를 둔다.
 * 데스크톱은 홈 › 대분류(검색 분류 화면) › 항목 경로를, 모바일은 대분류 꼬리표와 지역 바꾸기를 보여 준다.
 */
export function ItemHeader({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items');
  const categoryLabel = useCategoryLabel();
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const { scope } = useFilterLabels(filters);
  const { data, isPending, isError, error, refetch } = useQuery(
    npayQueries.detail(code),
  );

  let heading;
  if (isPending) {
    heading = (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-24 lg:h-5.5 lg:w-56" />
        <h1 className="text-display">
          <span className="sr-only">{t('header.loading')}</span>
          <Skeleton className="h-9 w-64 max-w-full lg:h-10" />
        </h1>
      </div>
    );
  } else if (isError) {
    heading = (
      <div className="flex flex-col gap-2">
        <h1 className="text-display">{t('header.fallbackTitle')}</h1>
        <div className="flex flex-wrap items-center gap-2" role="alert">
          <p className="text-body-sm text-text-secondary">
            {tErrors(errorMessageKey(error))}
          </p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            {tActions('retry')}
          </Button>
        </div>
      </div>
    );
  } else {
    const title = formatItemTitle(data);
    const categoryQuery = new URLSearchParams({
      ...(data.mdivCode && { code: data.mdivCode }),
      ...regionQuery(filters.region),
    }).toString();
    heading = (
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbLink href="/">{t('breadcrumb.home')}</BreadcrumbLink>
          {data.mdivCode && data.mdivName && (
            <BreadcrumbLink href={`/search?${categoryQuery}`}>
              {categoryLabel(data.mdivCode, data.mdivName)}
            </BreadcrumbLink>
          )}
          <BreadcrumbCurrent>{title}</BreadcrumbCurrent>
        </Breadcrumb>
        {data.mdivName && (
          <Tag className="w-fit lg:hidden">
            {categoryLabel(data.mdivCode, data.mdivName)}
          </Tag>
        )}
        <h1 className="text-display text-balance">
          {t('header.headline', { item: title, scope })}
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {heading}
      <PriceSummary code={code} filters={filters} />
      <RegionSwitch code={code} filters={filters} />
      <p className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
        <Info
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={1.75}
        />
        <span className="min-w-0 wrap-anywhere">{t('header.source')}</span>
      </p>
    </div>
  );
}

/** 모바일에서 제목의 지역을 바로 바꾼다. 데스크톱은 오른쪽 필터 열에 같은 선택지가 늘 보인다. */
function RegionSwitch({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.header');
  const tRegion = useTranslations('common.region');
  const applyFilters = useApplyFilters(code);
  const id = useId();
  return (
    <div className="lg:hidden">
      <p id={`${id}-label`} className="sr-only">
        {t('regionLabel')}
      </p>
      <SegmentedControl
        aria-labelledby={`${id}-label`}
        name={`${id}-region`}
        value={filters.region}
        options={SERVICE_REGIONS.map((region) => ({
          value: region,
          label: tRegion(region),
        }))}
        onValueChange={(region) => applyFilters(withRegion(filters, region))}
      />
    </div>
  );
}
