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
import { npayQueries } from '@/features/npay/queries';
import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';
import { errorMessageKey } from '@/lib/api/error-message';

import { formatItemTitle } from './item-title';

/** 데스크톱은 홈 › 대분류(검색 분류 화면) › 항목 경로를, 모바일은 대분류 꼬리표를 보여 준다. */
export function ItemHeader({
  code,
  region,
}: {
  code: string;
  region: ServiceRegion;
}) {
  const t = useTranslations('items');
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
        <SourceLine />
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
        <SourceLine />
      </div>
    );
  }

  const title = formatItemTitle(data);
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
            {data.mdivName}
          </BreadcrumbLink>
        )}
        <BreadcrumbCurrent>{title}</BreadcrumbCurrent>
      </Breadcrumb>
      {data.mdivName && <Tag className="w-fit lg:hidden">{data.mdivName}</Tag>}
      <h1 className="text-display">{title}</h1>
      <SourceLine />
    </div>
  );
}

function SourceLine() {
  const t = useTranslations('items.header');
  return (
    <p className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
      <Info aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
      {t('source')}
    </p>
  );
}
