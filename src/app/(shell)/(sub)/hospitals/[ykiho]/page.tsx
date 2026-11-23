import { HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';
import {
  decodeYkiho,
  parseBackParam,
  parseItemParam,
  parseVariantParam,
} from '@/features/hospitals/detail-links';
import {
  DEFAULT_REGION,
  parseServiceRegion,
} from '@/features/regions/service-region';

import {
  loadHospital,
  prefetchHospitalPage,
} from './_components/hospital-data';
import { HospitalDetail } from './_components/hospital-detail';
import { buildHospitalMetadata } from './_components/hospital-metadata';

export async function generateMetadata({
  params,
}: PageProps<'/hospitals/[ykiho]'>): Promise<Metadata> {
  const ykiho = decodeYkiho((await params).ykiho);
  const [hospital, t, tMeta] = await Promise.all([
    loadHospital(ykiho),
    getTranslations('hospitals.detail'),
    getTranslations('metadata'),
  ]);
  return buildHospitalMetadata({
    ykiho,
    hospital,
    t,
    siteName: tMeta('title'),
  });
}

/** 병원 상세(항목에서 왔으면 선택 카드까지)를 서버에서 익명으로 읽어 HTML에 담고, 브라우저는 같은 키로 이어받는다. */
export default async function HospitalDetailPage({
  params,
  searchParams,
}: PageProps<'/hospitals/[ykiho]'>) {
  const [{ ykiho: rawYkiho }, { item, back, variant, price }] =
    await Promise.all([params, searchParams]);
  const ykiho = decodeYkiho(rawYkiho);
  const itemCode = parseItemParam(item);
  const backQuery = itemCode ? parseBackParam(back) : null;
  const initialVariant = itemCode ? parseVariantParam(variant, price) : null;
  const backHref = itemCode
    ? backQuery
      ? (`/items/${itemCode}?${backQuery}` as const)
      : (`/items/${itemCode}` as const)
    : '/';
  /** HospitalDetail이 처음 들어온 항목의 지역 평균을 고르는 규칙과 같다. */
  const region = backQuery
    ? parseServiceRegion(new URLSearchParams(backQuery).get('region'))
    : DEFAULT_REGION;
  const [state, t] = await Promise.all([
    prefetchHospitalPage(ykiho, itemCode ? { item: itemCode, region } : null),
    getTranslations('hospitals.detail'),
  ]);

  return (
    <>
      <SubTopBar title={t('topBarTitle')} backHref={backHref} />
      <HydrationBoundary state={state}>
        <HospitalDetail
          ykiho={ykiho}
          initialItem={itemCode}
          initialVariant={initialVariant}
          back={backQuery}
        />
      </HydrationBoundary>
    </>
  );
}
