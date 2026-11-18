import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import { decodeYkiho, parseItemParam } from '@/features/hospitals/detail-links';

import { HospitalDetail } from './_components/hospital-detail';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('hospitals.detail');
  return { title: t('metaTitle') };
}

export default async function HospitalDetailPage({
  params,
  searchParams,
}: PageProps<'/hospitals/[ykiho]'>) {
  const [{ ykiho }, { item }, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('hospitals.detail'),
  ]);
  const itemCode = parseItemParam(item);
  const backHref = itemCode ? (`/items/${itemCode}` as const) : '/';

  return (
    <>
      <SubTopBar title={t('topBarTitle')} backHref={backHref} />
      <HospitalDetail ykiho={decodeYkiho(ykiho)} initialItem={itemCode} />
    </>
  );
}
