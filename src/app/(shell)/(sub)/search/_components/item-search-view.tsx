'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import {
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import { searchQueries, totalCount } from '@/features/search/queries';

import { ItemGroupList } from './item-group-list';
import { ListSkeleton } from './list-skeleton';
import { LoadMore } from './load-more';
import { ResultHeader } from './result-header';
import { ResultsError } from './results-error';
import { ResultsLayout } from './results-layout';

/** S-02 A 항목 결과. 결과 없음·조회 실패에서는 오른쪽 열 대신 안내 패널의 버튼으로 이어 준다. */
export function ItemSearchView({
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
    searchQueries.items({ keyword, sidoCodes: sidoCodesOf(region) }),
  );
  const total = query.data ? totalCount(query.data.pages) : undefined;
  const items = query.data?.pages.flatMap((page) => page.content) ?? [];

  const header = (
    <ResultHeader
      title={
        total === undefined
          ? t('header.itemTitle', { query: keyword })
          : t.rich('header.itemTitleWithCount', {
              query: keyword,
              count: total,
              em: (chunks) => <em>{chunks}</em>,
            })
      }
      description={t('header.itemDescription')}
      status={
        total === undefined ? '' : t('header.itemStatus', { count: total })
      }
    />
  );

  if (query.isPending) {
    return (
      <>
        {header}
        <ResultsLayout>
          <ListSkeleton />
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
  if (items.length === 0) {
    return (
      <>
        {header}
        <PageContainer className="pb-section">
          <EmptyState
            icon={<Search />}
            title={t('empty.itemTitle', { query: keyword })}
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
        <ItemGroupList items={items} region={region} />
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
