import type { Metadata } from 'next';

import { fetchPopularItems, fetchSiteStats } from '@/server/api/home-data';

import { CategoryGrid } from './_components/category-grid';
import { FaqSection } from './_components/faq-section';
import { HomeHero } from './_components/home-hero';
import { HowItWorks } from './_components/how-it-works';
import { PopularItems } from './_components/popular-items';
import { TrustSection } from './_components/trust-section';

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** 통계와 인기 순위는 서버에서 읽어 넘긴다(10분 캐시). 실패하면 각각 숫자 없이, 고른 목록으로 그린다. */
export default async function HomePage() {
  const [stats, popular] = await Promise.all([
    fetchSiteStats(),
    fetchPopularItems(6),
  ]);
  return (
    <>
      <HomeHero />
      <CategoryGrid />
      <PopularItems
        ranked={popular.map(({ npayCode, name }) => ({ code: npayCode, name }))}
      />
      <HowItWorks />
      <TrustSection stats={stats} />
      <FaqSection />
    </>
  );
}
