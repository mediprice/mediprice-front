import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';
import { parsePriceFilters } from '@/features/npay/price-filters';

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
import { PriceResults } from './_components/price-results';
import { PriceSummary } from './_components/price-summary';

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
          <div className="rounded-b-4xl bg-primary-tint lg:rounded-none">
            <PageContainer className="flex flex-col gap-5 py-6 lg:py-10">
              <ItemHeader code={code} region={filters.region} />
              <PriceSummary
                code={code}
                filters={filters}
                className="flex lg:hidden"
              />
            </PageContainer>
          </div>
          <MobileToolbar code={code} filters={filters} />
          <div className="flex-1 bg-surface">
            <PageContainer className="flex flex-col gap-4 pt-4 pb-section lg:flex-row lg:items-start lg:gap-8 lg:pt-8">
              <FilterColumn code={code} filters={filters} />
              <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-6">
                <PriceSummary
                  code={code}
                  filters={filters}
                  className="hidden lg:flex"
                />
                <PriceResults code={code} filters={filters} />
              </div>
            </PageContainer>
          </div>
        </ItemGate>
      </HydrationBoundary>
    </>
  );
}
