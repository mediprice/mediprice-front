import { useInfiniteQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { searchQueries, totalCount } from '@/features/search/queries';
import type { Region } from '@/features/search/search-params';

import { ItemGroupList } from './item-group-list';
import { ListSkeleton } from './list-skeleton';
import { LoadMore } from './load-more';
import { ResultsError } from './results-error';
import { StatusPanel } from './status-panel';

/** 고른 분류의 항목. 홈 분야처럼 백엔드 분류가 여럿이면 차례로 이어 붙인다. */
export function CategoryItems({
  codes,
  region,
}: {
  codes: readonly string[];
  region: Region;
}) {
  const t = useTranslations('search');
  const query = useInfiniteQuery(searchQueries.items({ categoryCodes: codes }));
  const total = query.data ? totalCount(query.data.pages) : undefined;
  const items = query.data?.pages.flatMap((page) => page.content) ?? [];

  return (
    <>
      <p role="status" className="sr-only">
        {total === undefined ? '' : t('header.itemStatus', { count: total })}
      </p>
      {query.isPending ? (
        <ListSkeleton />
      ) : !query.data ? (
        <ResultsError
          error={query.error}
          isRetrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <StatusPanel
          icon={<FolderOpen />}
          title={t('empty.categoryTitle')}
          description={t('empty.categoryDescription')}
        />
      ) : (
        <section aria-labelledby="search-category-items" className="space-y-2">
          <h2
            id="search-category-items"
            className="pt-2 text-label-bold text-text-secondary"
          >
            {t('category.itemCount', { count: total ?? items.length })}
          </h2>
          <ItemGroupList items={items} region={region} headingAs="h3" />
          <LoadMore
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            error={query.isFetchNextPageError ? query.error : null}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </section>
      )}
    </>
  );
}
