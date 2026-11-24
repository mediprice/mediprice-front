import type { MetadataRoute } from 'next';

import { env } from '@/env';
import { parseItemParam } from '@/features/hospitals/detail-links';
import { POPULAR_ITEMS } from '@/features/npay/catalog';
import {
  type HospitalSitemapEntry,
  listHospitalEntries,
} from '@/server/api/hospital-sitemap';
import { listItemCodes } from '@/server/api/item-codes';

const STATIC_ROUTES = [
  '/',
  '/map',
  '/privacy',
  '/terms',
  '/location-terms',
  '/policy/reviews',
];

/** 사이트맵 한 파일의 한도는 50,000개다. 항목과 병원을 합쳐 그보다 작게 둔다. 넘으면 generateSitemaps로 나눈다. */
const MAX_ITEMS = 5_000;
const MAX_HOSPITALS = 40_000;

/** 항목 목록과 같은 주기로 하루에 한 번 다시 만든다. */
export const revalidate = 86400;

/** 백엔드가 답하지 않으면(빌드 중 장애 등) 인기 항목만 넣는다. */
async function itemCodes() {
  const popular = POPULAR_ITEMS.map(({ code }) => code);
  try {
    return [...new Set([...popular, ...(await listItemCodes(MAX_ITEMS))])];
  } catch (error) {
    console.warn('sitemap: item list unavailable, using popular items', error);
    return popular;
  }
}

/** 가격이 있는 병원만 넣는다. 목록 API가 아직 없거나 장애면 병원 없이 만든다. */
async function hospitalEntries(): Promise<HospitalSitemapEntry[]> {
  try {
    return await listHospitalEntries(MAX_HOSPITALS);
  } catch (error) {
    console.warn(
      'sitemap: hospital list unavailable, skipping hospitals',
      error,
    );
    return [];
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
  const [allCodes, hospitals] = await Promise.all([
    itemCodes(),
    hospitalEntries(),
  ]);
  const codes = allCodes.filter((code) => parseItemParam(code));
  const itemEntries = codes.map((code) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}/items/${encodeURIComponent(code)}`,
    changeFrequency: 'weekly' as const,
    priority: popular.has(code) ? 0.8 : 0.6,
  }));
  const hospitalUrls = hospitals.map(({ ykiho, lastModified }) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}/hospitals/${encodeURIComponent(ykiho)}`,
    ...(lastModified && { lastModified }),
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }));
  return [...staticEntries, ...itemEntries, ...hospitalUrls];
}
