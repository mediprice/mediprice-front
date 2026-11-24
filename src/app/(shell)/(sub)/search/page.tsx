import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { findHomeCategory } from '@/features/npay/catalog';
import { parseSearchParams } from '@/features/search/search-params';

import { CategoryView } from './_components/category-view';
import { HospitalSearchView } from './_components/hospital-search-view';
import { ItemSearchView } from './_components/item-search-view';
import { SearchHeader } from './_components/search-header';
import { SearchSuggestions } from './_components/search-suggestions';
import { SuggestionButtons } from './_components/suggestion-buttons';

export async function generateMetadata({
  searchParams,
}: PageProps<'/search'>): Promise<Metadata> {
  const t = await getTranslations('search.metadata');
  const state = parseSearchParams(await searchParams);
  if (state.mode === 'category') return { title: t('category') };
  if (state.mode === 'prompt') return { title: t('title') };
  return { title: t('titleWithQuery', { query: state.keyword }) };
}

/** S-02 검색 결과. URL(type·q·region·category·code)이 화면 상태 전부라 그대로 공유할 수 있다. */
export default async function SearchPage({
  searchParams,
}: PageProps<'/search'>) {
  const state = parseSearchParams(await searchParams);
  const t = await getTranslations('search');

  if (state.mode === 'category') {
    const home = state.category ? findHomeCategory(state.category) : undefined;
    return (
      <>
        <SubTopBar title={t('topBar.category')} backHref="/" />
        <SearchHeader
          type="item"
          keyword=""
          region={state.region}
          className="hidden lg:block"
        />
        <CategoryView
          home={home && { id: home.id, codes: home.categoryCodes }}
          code={state.code}
          region={state.region}
        />
      </>
    );
  }

  const type = state.mode === 'prompt' ? state.type : state.mode;
  const keyword = state.mode === 'prompt' ? '' : state.keyword;
  return (
    <>
      <SubTopBar
        title={
          state.mode === 'prompt' ? t('topBar.search') : t('topBar.results')
        }
        backHref="/"
        showSearch={false}
      />
      <SearchHeader
        type={type}
        keyword={keyword}
        region={state.region}
        current={
          state.mode === 'prompt'
            ? t('breadcrumb.search')
            : t('breadcrumb.results')
        }
      />

      {state.mode === 'item' && (
        <ItemSearchView
          keyword={keyword}
          region={state.region}
          aside={
            <SearchSuggestions
              links={['category', 'hospital']}
              keyword={keyword}
              region={state.region}
              title={t('suggestions.title')}
              showPriceNotice
            />
          }
          emptyActions={
            <SuggestionButtons
              links={['category', 'hospital']}
              keyword={keyword}
              region={state.region}
            />
          }
        />
      )}

      {state.mode === 'hospital' && (
        <HospitalSearchView
          keyword={keyword}
          region={state.region}
          aside={
            <SearchSuggestions
              links={['category', 'item']}
              keyword={keyword}
              region={state.region}
              title={t('suggestions.hospitalTitle')}
            />
          }
          emptyActions={
            <SuggestionButtons
              links={['item']}
              keyword={keyword}
              region={state.region}
            />
          }
        />
      )}

      {state.mode === 'prompt' && (
        <PageContainer className="pt-4 pb-section lg:pt-10">
          <h1 className="sr-only">{t('topBar.search')}</h1>
          <EmptyState
            icon={<Search />}
            title={t('prompt.title')}
            description={
              type === 'item'
                ? t('prompt.itemDescription')
                : t('prompt.hospitalDescription')
            }
            action={
              <SuggestionButtons
                links={['category']}
                keyword=""
                region={state.region}
              />
            }
          />
        </PageContainer>
      )}
    </>
  );
}
