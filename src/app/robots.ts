import type { MetadataRoute } from 'next';

import { env } from '@/env';

/** 개인 화면(/my·/oauth), 운영 화면(/admin)과 BFF는 긁지 않는다. 검색·관심·비교·AI는 크롤링은 두고 각 레이아웃의 noindex로 색인만 막는다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/bff/', '/my', '/oauth', '/admin'],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
