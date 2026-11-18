import { useInfiniteQuery } from '@tanstack/react-query';
import { FolderOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import { searchQueries, totalCount } from '@/features/search/queries';

import { ItemGroupList } from './item-group-list';
import { ListSkeleton } from './list-skeleton';
import { LoadMore } from './load-more';
import { ResultsError } from './results-error';
import { ResultsLayout } from './results-layout';
import { StatusPanel } from './status-panel';

/**
 * 고른 분류의 항목. codes가 없으면(분류 목록을 불러오는 중) 같은 자리에 뼈대만 그린다.
 * 오른쪽 열(모바일은 목록 아래)은 목록이 온 뒤에 붙인다. 뼈대보다 목록이 짧을 때 위로 끌려 올라오지 않게 하려는 것이다.
 */
export function CategoryItems({
  codes,
  region,
  aside,
}: {
  codes: readonly string[] | undefined;
  region: ServiceRegion;
  aside: ReactNode;
}) {
  const t = useTranslations('search');
  const query = useInfiniteQuery({
    ...searchQueries.items({
      categoryCodes: codes ?? [],
      sidoCodes: sidoCodesOf(region),
    }),
    enabled: codes !== undefined,
  });
  const total = query.data ? totalCount(query.data.pages) : undefined;
  const items = query.data?.pages.flatMap((page) => page.content) ?? [];

  return (
    <ResultsLayout aside={query.isPending ? undefined : aside}>
      <section aria-labelledby="search-category-items" className="space-y-2">
        <h2
          id="search-category-items"
          className="flex min-h-7.5 items-center pt-2 text-label-bold text-text-secondary"
        >
          {total === undefined ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            t('category.itemCount', { count: total })
          )}
        </h2>
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
          <>
            <ItemGroupList items={items} region={region} headingAs="h3" />
            <LoadMore
              hasNextPage={query.hasNextPage}
              isFetchingNextPage={query.isFetchingNextPage}
              error={query.isFetchNextPageError ? query.error : null}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </>
        )}
      </section>
    </ResultsLayout>
  );
}
