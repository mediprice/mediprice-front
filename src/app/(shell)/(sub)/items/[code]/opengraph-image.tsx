import { QueryClient } from '@tanstack/react-query';
import { ImageResponse } from 'next/og';
import { createTranslator } from 'next-intl';
import { getFormatter, getTranslations } from 'next-intl/server';

import {
  loadPretendard,
  OgFrame,
  OgHighlight,
} from '@/app/_components/og-image';
import { parseItemParam } from '@/features/hospitals/detail-links';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import metadata from '@/i18n/messages/ko/metadata.json';
import { fetchSiteStats } from '@/server/api/home-data';
import { publicApi } from '@/server/api/public-client';

import { formatItemTitle } from './_components/item-title';

export const alt = createTranslator({
  locale: 'ko',
  messages: { metadata },
  namespace: 'metadata',
})('ogImage.item.alt');
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** 항목 이름, 서울·경기 평균, 공개 가격 기준일. 백엔드가 답하지 않으면 이름 없이 공통 문구로 그린다. */
export default async function ItemOpengraphImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const code = parseItemParam((await params).code);
  const queryClient = new QueryClient();
  const [item, summary, stats, fonts, t, tRegion, format] = await Promise.all([
    code
      ? queryClient
          .fetchQuery(npayQueries.detail(code, publicApi))
          .catch(() => null)
      : null,
    code
      ? queryClient
          .fetchQuery(
            npayQueries.summaryIn(code, sidoCodesOf(DEFAULT_REGION), publicApi),
          )
          .catch(() => null)
      : null,
    fetchSiteStats(),
    loadPretendard(),
    getTranslations('metadata'),
    getTranslations('common.region'),
    getFormatter(),
  ]);
  const region = tRegion(DEFAULT_REGION);
  const date = stats?.dataDate
    ? format.dateTime(new Date(stats.dataDate), 'date')
    : null;

  return new ImageResponse(
    <OgFrame
      siteName={t('title')}
      hasFont={fonts !== undefined}
      eyebrow={t('ogImage.item.eyebrow')}
      title={item ? formatItemTitle(item) : t('ogImage.headline')}
      footer={
        date ? t('ogImage.footerWithDate', { date }) : t('ogImage.caption')
      }
    >
      {summary?.avgPrice != null && (
        <OgHighlight
          label={t('ogImage.item.average', {
            region,
            count: summary.hospitalCount,
          })}
          value={t('ogImage.won', { amount: summary.avgPrice })}
        />
      )}
    </OgFrame>,
    { ...size, fonts },
  );
}
