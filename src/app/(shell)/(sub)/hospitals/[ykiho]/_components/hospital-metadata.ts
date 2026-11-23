import type { Metadata } from 'next';
import type { getTranslations } from 'next-intl/server';

import { openGraphFor } from '@/app/_components/open-graph';
import { formatLocation } from '@/features/regions/format-location';
import type { components } from '@/lib/api/schema';

type Hospital = components['schemas']['HospitalDetailResponse'];
type Translate = Awaited<
  ReturnType<typeof getTranslations<'hospitals.detail'>>
>;

/** 병원 이름과 시도·시군구를 제목·설명에 넣는다. 항목·세부 항목 파라미터가 붙은 주소도 canonical은 병원 하나다. */
export function buildHospitalMetadata({
  ykiho,
  hospital,
  t,
  siteName,
}: {
  ykiho: string;
  hospital: Hospital | null;
  t: Translate;
  /** og:site_name(metadata.title). */
  siteName: string;
}): Metadata {
  const canonical = `/hospitals/${encodeURIComponent(ykiho)}`;
  const alternates = { canonical };
  const openGraph = openGraphFor(canonical, siteName);
  if (!hospital) return { title: t('metaTitle'), alternates, openGraph };

  const { name } = hospital;
  const location = formatLocation(hospital.sidoName, hospital.sgguName);
  return location
    ? {
        title: t('metadata.titleWithLocation', { name, location }),
        description: t('metadata.descriptionWithLocation', { name, location }),
        alternates,
        openGraph,
      }
    : {
        title: t('metadata.title', { name }),
        description: t('metadata.description', { name }),
        alternates,
        openGraph,
      };
}
