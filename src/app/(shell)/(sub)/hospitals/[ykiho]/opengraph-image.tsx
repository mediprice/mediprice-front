import { QueryClient } from '@tanstack/react-query';
import { ImageResponse } from 'next/og';
import { createTranslator } from 'next-intl';
import { getFormatter, getTranslations } from 'next-intl/server';

import {
  loadPretendard,
  OgFrame,
  OgHighlight,
} from '@/app/_components/og-image';
import { parseYkiho } from '@/features/hospitals/detail-links';
import { hospitalQueries } from '@/features/hospitals/queries';
import { formatLocation } from '@/features/regions/format-location';
import metadata from '@/i18n/messages/ko/metadata.json';
import { fetchSiteStats } from '@/server/api/home-data';
import { publicApi } from '@/server/api/public-client';

export const alt = createTranslator({
  locale: 'ko',
  messages: { metadata },
  namespace: 'metadata',
})('ogImage.hospital.alt');
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** 병원 이름, 종별·지역, 공개한 비급여 항목 수, 공개 가격 기준일. 병원 키 형식이 아니면 백엔드에 묻지 않고 공통 문구로 그린다. */
export default async function HospitalOpengraphImage({
  params,
}: {
  params: Promise<{ ykiho: string }>;
}) {
  const ykiho = parseYkiho((await params).ykiho);
  const queryClient = new QueryClient();
  const [hospital, prices, stats, fonts, t, format] = await Promise.all([
    ykiho
      ? queryClient
          .fetchQuery(hospitalQueries.detail(ykiho, publicApi))
          .catch(() => null)
      : null,
    ykiho
      ? queryClient
          .fetchInfiniteQuery(hospitalQueries.priceList(ykiho, {}, publicApi))
          .catch(() => null)
      : null,
    fetchSiteStats(),
    loadPretendard(),
    getTranslations('metadata'),
    getFormatter(),
  ]);
  const eyebrow = hospital
    ? [hospital.className, formatLocation(hospital.sidoName, hospital.sgguName)]
        .filter(Boolean)
        .join(' · ')
    : '';
  const itemCount = prices?.pages[0]?.totalElements;
  const date = stats?.dataDate
    ? format.dateTime(new Date(stats.dataDate), 'date')
    : null;

  return new ImageResponse(
    <OgFrame
      siteName={t('title')}
      hasFont={fonts !== undefined}
      eyebrow={eyebrow || undefined}
      title={hospital?.name ?? t('ogImage.headline')}
      footer={
        date ? t('ogImage.footerWithDate', { date }) : t('ogImage.caption')
      }
    >
      {itemCount != null && itemCount > 0 && (
        <OgHighlight
          label={t('ogImage.hospital.items')}
          value={t('ogImage.hospital.itemCount', { count: itemCount })}
        />
      )}
    </OgFrame>,
    { ...size, fonts },
  );
}
