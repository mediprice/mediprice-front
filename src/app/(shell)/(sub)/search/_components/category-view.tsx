'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderSearch } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import type { HomeCategoryId } from '@/features/npay/catalog';
import { npayQueries } from '@/features/npay/queries';
import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';
import { resolveCategoryView } from '@/features/search/category-tree';

import { CategoryHeader } from './category-header';
import { CategoryItems } from './category-items';
import { CategoryRoot } from './category-root';
import { ResultsError } from './results-error';
import { SearchSuggestions } from './search-suggestions';
import { StatusPanel } from './status-panel';

/**
 * S-02 C 분류 모드. 백엔드 분류 목록으로 경로·하위 분류를 만들고 고른 분류의 항목을 보여 준다.
 * 분류 목록을 기다리는 동안에도 머리와 목록 자리를 같은 높이로 그려 화면이 밀리지 않게 한다.
 */
export function CategoryView({
  home,
  code,
  region,
}: {
  home: { id: HomeCategoryId; codes: readonly string[] } | undefined;
  code: string | undefined;
  region: ServiceRegion;
}) {
  const t = useTranslations('search');
  const categories = useQuery(npayQueries.categories());

  if (!home && !code) {
    return <CategoryRoot categories={categories} region={region} />;
  }
  if (categories.isError) {
    return (
      <PageContainer className="pb-section lg:pt-10">
        <h1 className="sr-only">{t('topBar.category')}</h1>
        <ResultsError
          error={categories.error}
          isRetrying={categories.isFetching}
          onRetry={() => void categories.refetch()}
        />
      </PageContainer>
    );
  }

  const view = categories.data
    ? resolveCategoryView(categories.data, { homeCodes: home?.codes, code })
    : undefined;
  if (view === null) {
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
                  query: { category: 'all', ...regionQuery(region) },
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
      <CategoryHeader
        homeId={home?.id}
        code={code}
        view={view}
        region={region}
      />
      <CategoryItems
        codes={view?.scopeCodes}
        region={region}
        aside={
          <SearchSuggestions
            links={['allCategories']}
            keyword=""
            region={region}
            title={t('suggestions.title')}
            showPriceNotice
          />
        }
      />
    </>
  );
}
