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
    </>
  );
}
