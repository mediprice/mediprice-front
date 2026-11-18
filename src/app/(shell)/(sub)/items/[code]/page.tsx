import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';

import { FilterColumn } from './_components/filter-column';
import {
  loadDefaultSummary,
  loadItem,
  prefetchItemPage,
} from './_components/item-data';
import { ItemGate } from './_components/item-gate';
import { ItemHeader } from './_components/item-header';
import { buildItemMetadata } from './_components/item-metadata';
import { MobileToolbar } from './_components/mobile-toolbar';
import { parsePriceFilters } from './_components/price-filters';
import { PriceResults } from './_components/price-results';

export async function generateMetadata({
  params,
}: PageProps<'/items/[code]'>): Promise<Metadata> {
  const { code } = await params;
  const [item, summary, t, tRegion] = await Promise.all([
    loadItem(code),
    loadDefaultSummary(code),
    getTranslations('items.metadata'),
    getTranslations('common.region'),
  ]);
  return buildItemMetadata({
    code,
    item,
    summary,
    regionLabel: tRegion('metro'),
    t,
  });
}

/** 상세·요약·가격 첫 묶음을 서버에서 익명으로 읽어 HTML에 담고, 브라우저는 같은 키로 이어받아 바로 그린다. */
export default async function ItemPricePage({
  params,
  searchParams,
}: PageProps<'/items/[code]'>) {
  const { code } = await params;
  const filters = parsePriceFilters(await searchParams);
  const [state, t] = await Promise.all([
    prefetchItemPage(code, filters),
    getTranslations('items'),
  ]);

  return (
    <>
      <SubTopBar title={t('topBar.title')} backHref="/" />
      <HydrationBoundary state={state}>
        <ItemGate code={code}>
          <PageContainer className="flex flex-1 flex-col pt-5 pb-section lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:content-start lg:gap-x-12 lg:pt-6">
            <div className="pb-6 lg:col-start-1 lg:row-start-1 lg:pb-10">
              <ItemHeader code={code} filters={filters} />
            </div>
            <MobileToolbar code={code} filters={filters} />
            <FilterColumn code={code} filters={filters} />
            <div className="pt-5 lg:col-start-1 lg:row-start-2 lg:pt-0">
              <PriceResults code={code} filters={filters} />
            </div>
          </PageContainer>
        </ItemGate>
      </HydrationBoundary>
    </>
  );
}
