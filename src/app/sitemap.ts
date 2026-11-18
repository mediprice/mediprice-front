import type { MetadataRoute } from 'next';

import { env } from '@/env';
import { POPULAR_ITEMS } from '@/features/npay/catalog';

const STATIC_ROUTES = ['/', '/map', '/privacy', '/terms', '/policy/reviews'];

/** 전체 항목·병원 목록은 백엔드에 목록(코드만 주는) 엔드포인트가 생기면 generateSitemaps로 나눠 더한다. 지금은 홈의 인기 항목만 넣는다(분류·검색은 noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.5,
  }));
  const itemEntries = POPULAR_ITEMS.map(({ code }) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}/items/${encodeURIComponent(code)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  return [...staticEntries, ...itemEntries];
}
