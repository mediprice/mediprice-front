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
import { relaxedKeyword } from '@/features/search/relaxed-keyword';

import { ItemGroupList } from './item-group-list';
import { ListSkeleton } from './list-skeleton';
import { LoadMore } from './load-more';
import { ResultHeader } from './result-header';
import { ResultsError } from './results-error';
import { ResultsLayout } from './results-layout';
import { useFillPriced } from './use-fill-priced';
import { ZeroResultHints } from './zero-result-hints';

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
  const sidoCodes = sidoCodesOf(region);
  const primary = useInfiniteQuery(searchQueries.items({ keyword, sidoCodes }));
  /** 0건이면 띄어쓰기·꼬리말을 다듬은 검색어로 한 번 더 찾는다("도수 치료", "임플란트 가격"). */
  const relaxed = relaxedKeyword(keyword);
  const isPrimaryEmpty =
    primary.data?.pages.every((page) => page.content.length === 0) ?? false;
  const fallback = useInfiniteQuery({
    ...searchQueries.items({ keyword: relaxed ?? '', sidoCodes }),
    enabled: isPrimaryEmpty && relaxed !== null,
  });
  const usesFallback =
    isPrimaryEmpty &&
    relaxed !== null &&
    (fallback.data?.pages.some((page) => page.content.length > 0) ?? false);
  const isFallbackPending =
    isPrimaryEmpty && relaxed !== null && fallback.isPending;
  const query = usesFallback ? fallback : primary;
  const total = query.data ? totalCount(query.data.pages) : undefined;
  const pages = query.data?.pages.map((page) => page.content) ?? [];
  const items = pages.flat();
  const { isFilling } = useFillPriced({
    pages,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
  });

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

  if (query.isPending || isFallbackPending) {
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
            action={
              <div className="flex flex-col items-center gap-3">
                <ZeroResultHints keyword={keyword} region={region} />
                {emptyActions}
              </div>
            }
          />
        </PageContainer>
      </>
    );
  }
  return (
    <>
      {header}
      <ResultsLayout aside={aside}>
        {usesFallback && relaxed && (
          <p className="rounded-lg bg-primary-tint px-4 py-3 text-body-sm text-primary-text">
            {t('relaxed.notice', { query: keyword, relaxed })}
          </p>
        )}
        <ItemGroupList pages={pages} isFilling={isFilling} region={region} />
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
