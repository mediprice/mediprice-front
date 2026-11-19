'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Info, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import {
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import { searchQueries, totalCount } from '@/features/search/queries';

import { HospitalCard } from './hospital-card';
import { ListSkeleton } from './list-skeleton';
import { LoadMore } from './load-more';
import { ResultHeader } from './result-header';
import { ResultsError } from './results-error';
import { ResultsLayout } from './results-layout';

/** S-02 B 병원 결과. 병원 목록에는 가격이 없다는 안내를 목록 위에 둔다. */
export function HospitalSearchView({
  keyword,
  region,
  aside,
  emptyActions,
}: {
  keyword: string;
  region: ServiceRegion;
  aside: ReactNode;
  emptyActions: ReactNode;
}) {
  const t = useTranslations('search');
  const query = useInfiniteQuery(
    searchQueries.hospitals({ keyword, sidoCodes: sidoCodesOf(region) }),
  );
  const total = query.data ? totalCount(query.data.pages) : undefined;
  const hospitals = query.data?.pages.flatMap((page) => page.content) ?? [];
  const names = hospitals.map((hospital) => hospital.name);
  const hasSameNames = new Set(names).size < names.length;

  const notice = (
    <p className="mt-2 flex items-start gap-2 rounded-lg bg-primary-tint px-4 py-3 text-body-sm text-text-primary">
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4.5 shrink-0 text-primary"
        strokeWidth={1.75}
      />
      {t('hospital.notice')}
    </p>
  );

  const header = (
    <ResultHeader
      title={
        total === undefined
          ? t('header.hospitalTitle', { query: keyword })
          : t.rich('header.hospitalTitleWithCount', {
              query: keyword,
              count: total,
              em: (chunks) => <em>{chunks}</em>,
            })
      }
      status={
        total === undefined ? '' : t('header.hospitalStatus', { count: total })
      }
    />
  );

  if (query.isPending) {
    return (
      <>
        {header}
        <ResultsLayout>
          {notice}
          <ListSkeleton variant="hospital" />
        </ResultsLayout>
      </>
    );
  }
  if (!query.data) {
    return (
      <>
        {header}
        <PageContainer className="pb-section">
          <ResultsError
            error={query.error}
            isRetrying={query.isFetching}
            onRetry={() => void query.refetch()}
          />
        </PageContainer>
      </>
    );
  }
  if (hospitals.length === 0) {
    return (
      <>
        {header}
        <PageContainer className="pb-section">
          <EmptyState
            icon={<Search />}
            title={t('empty.hospitalTitle', { query: keyword })}
            description={t('empty.description')}
            action={emptyActions}
          />
        </PageContainer>
      </>
    );
  }
  return (
    <>
      {header}
      <ResultsLayout aside={aside}>
        {notice}
        <ul className="space-y-3 lg:space-y-4">
          {hospitals.map((hospital) => (
            <li key={hospital.ykiho}>
              <HospitalCard hospital={hospital} />
            </li>
          ))}
        </ul>
        {hasSameNames && (
          <p className="text-body-sm text-text-secondary">
            {t('hospital.duplicateNotice')}
          </p>
        )}
        <LoadMore
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
          error={query.isFetchNextPageError ? query.error : null}
          onLoadMore={() => void query.fetchNextPage()}
        />
      </ResultsLayout>
    </>
  );
}
