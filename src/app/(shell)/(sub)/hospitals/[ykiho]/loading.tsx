import { getTranslations } from 'next-intl/server';

import { SubTopBar } from '@/components/layout/sub-top-bar';

import { DetailSkeleton } from './_components/detail-skeleton';

/** 서버가 병원 정보와 선택 항목 가격을 읽는 동안 지도·패널 뼈대를 바로 보여 준다. */
export default async function HospitalDetailLoading() {
  const t = await getTranslations('hospitals.detail');
  return (
    <>
      <SubTopBar title={t('topBarTitle')} backHref="/" />
      <DetailSkeleton />
    </>
  );
}
