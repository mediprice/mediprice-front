import type { Metadata } from 'next';
import type { getTranslations } from 'next-intl/server';

import { openGraphFor } from '@/app/_components/open-graph';
import { formatItemPath } from '@/features/npay/item-name';
import type { PriceSummary } from '@/features/npay/price-summary';
import type { components } from '@/lib/api/schema';

type Item = components['schemas']['NpayItemDetailResponse'];
type Translate = Awaited<ReturnType<typeof getTranslations<'items.metadata'>>>;

/** 항목 이름을 제목에, 서울·경기 평균이 있으면 설명에 넣는다. 백엔드가 답하지 않았으면(null) 공통 문구다. */
export function buildItemMetadata({
  code,
  item,
  summary,
  regionLabel,
  siteName,
  t,
}: {
  code: string;
  item: Item | null;
  summary: PriceSummary | null;
  regionLabel: string;
  /** 공유 미리보기의 사이트 이름(루트 metadata.title과 같다). */
  siteName: string;
  t: Translate;
}): Metadata {
  const canonical = `/items/${encodeURIComponent(code)}`;
  const alternates = { canonical };
  const openGraph = openGraphFor(canonical, siteName);
  if (!item) {
    return {
      title: t('fallbackTitle'),
      description: t('fallbackDescription'),
      alternates,
      openGraph,
    };
  }
  const name = formatItemPath(item.name, item.mdivName);
  const description =
    summary?.avgPrice != null
      ? t('descriptionWithAverage', {
          name,
          region: regionLabel,
          average: summary.avgPrice,
          hospitals: summary.hospitalCount,
        })
      : t('descriptionWithoutAverage', { name });
  return { title: t('title', { name }), description, alternates, openGraph };
}
