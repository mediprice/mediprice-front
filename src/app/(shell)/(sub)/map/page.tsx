import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { parseMapParams } from '@/features/map/map-params';

import { itemListHref } from './_components/item-list-href';
import { MapView } from './_components/map-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('map.metadata');
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/map' },
  };
}

export default async function MapPage({ searchParams }: PageProps<'/map'>) {
  const params = parseMapParams(await searchParams);
  const t = await getTranslations('map.topBar');

  return (
    <>
      <SubTopBar
        title={t('title')}
        backHref={
          params.item
            ? itemListHref(params.item, params.region, params.back ?? null)
            : '/'
        }
      />
      <MapView initialParams={params} />
    </>
  );
}
