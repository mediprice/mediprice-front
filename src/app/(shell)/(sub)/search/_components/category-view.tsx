'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderSearch } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { HomeCategoryId } from '@/features/npay/catalog';
import { npayQueries } from '@/features/npay/queries';
import { resolveCategoryView } from '@/features/search/category-tree';
import { type Region, withRegion } from '@/features/search/search-params';

import { CategoryHeader } from './category-header';
import { CategoryItems } from './category-items';
import { CategoryRoot } from './category-root';
import { ListSkeleton } from './list-skeleton';
import { ResultsError } from './results-error';
import { ResultsLayout } from './results-layout';
import { SearchSuggestions } from './search-suggestions';
import { StatusPanel } from './status-panel';

/** S-02 C 분류 모드. 백엔드 분류 목록으로 경로와 하위 분류를 만들고, 고른 분류의 항목을 보여 준다. */
export function CategoryView({
  home,
  code,
  region,
}: {
  home: { id: HomeCategoryId; codes: readonly string[] } | undefined;
  code: string | undefined;
  region: Region;
}) {
  const t = useTranslations('search');
  const categories = useQuery(npayQueries.categories());

  if (categories.isPending) {
    return (
      <>
        <PageContainer className="space-y-3 pt-5 pb-4 lg:pt-10 lg:pb-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-full max-w-md" />
        </PageContainer>
        <ResultsLayout>
          <ListSkeleton />
        </ResultsLayout>
      </>
    );
  }
  if (categories.isError) {
    return (
      <PageContainer className="pb-section">
        <h1 className="sr-only">{t('topBar.category')}</h1>
        <ResultsError
          error={categories.error}
          isRetrying={categories.isFetching}
          onRetry={() => void categories.refetch()}
        />
      </PageContainer>
    );
  }
  if (!home && !code) {
    return <CategoryRoot categories={categories.data} region={region} />;
  }

  const view = resolveCategoryView(categories.data, {
    homeCodes: home?.codes,
    code,
  });
  if (!view) {
    return (
      <PageContainer className="pb-section lg:pt-10">
        <StatusPanel
          titleAs="h1"
          icon={<FolderSearch />}
          title={t('category.notFound')}
          description={t('category.notFoundDescription')}
          actions={
            <Button asChild size="md" variant="tint">
              <Link
                href={{
                  pathname: '/search',
                  query: withRegion({ category: 'all' }, region),
                }}
              >
                {t('suggestions.allCategories.title')}
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <>
      <CategoryHeader homeId={home?.id} view={view} region={region} />
      <ResultsLayout
        aside={
          <SearchSuggestions
            links={['allCategories']}
            keyword=""
            region={region}
            title={t('suggestions.title')}
            showPriceNotice
          />
        }
      >
        <CategoryItems codes={view.scopeCodes} region={region} />
      </ResultsLayout>
    </>
  );
}
