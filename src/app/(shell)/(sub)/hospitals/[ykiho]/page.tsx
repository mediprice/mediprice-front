import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import {
  decodeYkiho,
  parseBackParam,
  parseItemParam,
  parseVariantParam,
} from '@/features/hospitals/detail-links';

import { HospitalDetail } from './_components/hospital-detail';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('hospitals.detail');
  return { title: t('metaTitle') };
}

export default async function HospitalDetailPage({
  params,
  searchParams,
}: PageProps<'/hospitals/[ykiho]'>) {
  const [{ ykiho }, { item, back, variant, price }, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('hospitals.detail'),
  ]);
  const itemCode = parseItemParam(item);
  const backQuery = itemCode ? parseBackParam(back) : null;
  const initialVariant = itemCode ? parseVariantParam(variant, price) : null;
  const backHref = itemCode
    ? backQuery
      ? (`/items/${itemCode}?${backQuery}` as const)
      : (`/items/${itemCode}` as const)
    : '/';

  return (
    <>
      <SubTopBar title={t('topBarTitle')} backHref={backHref} />
      <HospitalDetail
        ykiho={decodeYkiho(ykiho)}
        initialItem={itemCode}
        initialVariant={initialVariant}
        back={backQuery}
      />
    </>
  );
}
