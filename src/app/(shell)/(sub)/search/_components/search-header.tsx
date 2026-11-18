import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import type { ServiceRegion } from '@/features/regions/service-region';
import { cn } from '@/lib/utils';

import { SearchForm } from './search-form';

/** 검색어를 고쳐 다시 찾는 띠. 폼은 URL이 바뀔 때마다 새로 그려야 입력값이 URL과 맞으므로 key를 준다. */
export function SearchHeader({
  type,
  keyword,
  region,
  current,
  className,
}: {
  type: 'item' | 'hospital';
  keyword: string;
  region: ServiceRegion;
  /** 데스크톱 경로의 마지막 이름. 없으면 경로를 그리지 않는다(분류 화면은 자기 경로가 있다). */
  current?: string;
  className?: string;
}) {
  const t = useTranslations('search.breadcrumb');
  return (
    <div
      className={cn(
        'rounded-b-4xl bg-linear-to-b from-primary-tint via-hero via-60% to-bg lg:rounded-none lg:from-hero',
        className,
      )}
    >
      <PageContainer className="py-3.5 lg:pt-2 lg:pb-9">
        {current && (
          <Breadcrumb>
            <BreadcrumbLink href="/">{t('home')}</BreadcrumbLink>
            <BreadcrumbCurrent>{current}</BreadcrumbCurrent>
          </Breadcrumb>
        )}
        <div className={cn('lg:flex lg:justify-center', !current && 'lg:pt-7')}>
          <SearchForm
            key={`${type}:${keyword}:${region}`}
            type={type}
            keyword={keyword}
            region={region}
          />
        </div>
      </PageContainer>
    </div>
  );
}
