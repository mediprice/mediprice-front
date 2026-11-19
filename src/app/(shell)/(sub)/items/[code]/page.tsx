import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PageContainer } from '@/components/layout/page-container';
import { SubTopBar } from '@/components/layout/sub-top-bar';

import { FilterColumn } from './_components/filter-column';
import { ItemGate } from './_components/item-gate';
import { ItemHeader } from './_components/item-header';
import { MobileToolbar } from './_components/mobile-toolbar';
import { parsePriceFilters } from './_components/price-filters';
import { PriceResults } from './_components/price-results';
import { PriceSummary } from './_components/price-summary';

/** 항목 이름은 브라우저 전용 apiClient로만 가져올 수 있어 공통 제목을 두고, ItemGate가 받은 뒤 바꾼다. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('items.metadata');
  return { title: t('title'), description: t('description') };
}

export default async function ItemPricePage({
  params,
  searchParams,
}: PageProps<'/items/[code]'>) {
  const { code } = await params;
  const filters = parsePriceFilters(await searchParams);
  const t = await getTranslations('items');

  return (
    <>
      <SubTopBar title={t('topBar.title')} backHref="/" />
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
    </>
  );
}
