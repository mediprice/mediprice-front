import type { MetadataRoute } from 'next';

import { env } from '@/env';
import { parseItemParam } from '@/features/hospitals/detail-links';
import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { listItemCodes } from '@/server/api/item-codes';

const STATIC_ROUTES = ['/', '/map', '/privacy', '/terms', '/policy/reviews'];

/** 사이트맵 한 파일의 한도(50,000)보다 한참 작게 둔다. 넘으면 generateSitemaps로 나눈다. */
const MAX_ITEMS = 5_000;

/** 항목 목록과 같은 주기로 하루에 한 번 다시 만든다. */
export const revalidate = 86400;

/** 백엔드가 답하지 않으면(빌드 중 장애 등) 인기 항목만 넣는다. 병원은 코드만 주는 목록 엔드포인트가 없어 아직 넣지 않는다(검색은 검색어를 기록하고 noindex다). */
async function itemCodes() {
  const popular = POPULAR_ITEMS.map(({ code }) => code);
  try {
    return [...new Set([...popular, ...(await listItemCodes(MAX_ITEMS))])];
  } catch (error) {
    console.warn('sitemap: item list unavailable, using popular items', error);
    return popular;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const popular = new Set<string>(POPULAR_ITEMS.map(({ code }) => code));
  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.5,
  }));
  /** 항목 화면이 형식부터 404로 보내는 코드는 넣지 않는다. */
  const codes = (await itemCodes()).filter((code) => parseItemParam(code));
  const itemEntries = codes.map((code) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}/items/${encodeURIComponent(code)}`,
    changeFrequency: 'weekly' as const,
    priority: popular.has(code) ? 0.8 : 0.6,
  }));
  return [...staticEntries, ...itemEntries];
}
