'use client';

import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from '@/components/ui/tag';
import { formatItemPath } from '@/features/npay/item-name';
import { npayQueries } from '@/features/npay/queries';
import { useCategoryLabel } from '@/features/npay/use-category-label';
import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';
import { errorMessageKey } from '@/lib/api/error-message';

/** 데스크톱은 홈 › 대분류(검색 분류 화면) › 항목 경로를, 모바일은 대분류 꼬리표를 보여 준다. */
export function ItemHeader({
  code,
  region,
  dataDate = null,
}: {
  code: string;
  region: ServiceRegion;
  /** 공개 데이터 기준일(YYYY-MM-DD). 모르면 출처만 쓴다. */
  dataDate?: string | null;
}) {
  const t = useTranslations('items');
  const categoryLabel = useCategoryLabel();
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const { data, isPending, isError, error, refetch } = useQuery(
    npayQueries.detail(code),
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-24 lg:h-11" />
        <h1 className="text-display">
          <span className="sr-only">{t('header.loading')}</span>
          <Skeleton className="h-9 w-48 lg:h-10" />
        </h1>
        <SourceLine dataDate={dataDate} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2.5">
        <h1 className="text-display">{t('header.fallbackTitle')}</h1>
        <div className="flex flex-wrap items-center gap-2" role="alert">
          <p className="text-body-sm text-text-secondary">
            {tErrors(errorMessageKey(error))}
          </p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            {tActions('retry')}
          </Button>
        </div>
        <SourceLine dataDate={dataDate} />
      </div>
    );
  }

  const title = formatItemPath(data.name, data.mdivName);
  const categoryQuery = new URLSearchParams({
    ...(data.mdivCode && { code: data.mdivCode }),
    ...regionQuery(region),
  }).toString();

  return (
    <div className="flex flex-col gap-2.5">
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
      <h1 className="text-display">{title}</h1>
      <SourceLine dataDate={dataDate} />
    </div>
  );
}

/** 출처와 자료 기준일, 공개 가격이 실제 진료비와 다를 수 있다는 한 줄. 가격 화면마다 같은 자리에 둔다. */
function SourceLine({ dataDate }: { dataDate: string | null }) {
  const t = useTranslations('items.header');
  return (
    <div className="flex flex-col gap-0.5 text-body-sm text-text-tertiary">
      <p className="flex items-start gap-1.5">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={1.75}
        />
        <span>
          {dataDate
            ? t.rich('sourceWithDate', {
                date: new Date(`${dataDate}T00:00:00+09:00`),
                nowrap: (chunks) => (
                  <span className="whitespace-nowrap">{chunks}</span>
                ),
              })
            : t('source')}
        </span>
      </p>
      <p className="pl-5.5">{t('actualCostNote')}</p>
    </div>
  );
}
