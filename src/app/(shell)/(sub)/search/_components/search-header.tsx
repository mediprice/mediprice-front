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

/** 검색어를 고쳐 다시 찾는 흰 머리. 큰 검색창 하나와 아래 구분선만 둔다. 폼은 URL이 바뀔 때마다 새로 그려야 입력값이 URL과 맞으므로 key를 준다. */
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
    <div className={cn('border-b border-hairline', className)}>
      <PageContainer className="flex flex-col gap-2 py-4 md:py-6 lg:pt-6 lg:pb-8">
        {current && (
          <Breadcrumb>
            <BreadcrumbLink href="/">{t('home')}</BreadcrumbLink>
            <BreadcrumbCurrent>{current}</BreadcrumbCurrent>
          </Breadcrumb>
        )}
        <SearchForm
          key={`${type}:${keyword}:${region}`}
          type={type}
          keyword={keyword}
          region={region}
        />
      </PageContainer>
    </div>
  );
}
