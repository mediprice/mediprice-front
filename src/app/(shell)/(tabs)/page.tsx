import type { Metadata } from 'next';

import { PageContainer } from '@/components/layout/page-container';

import { AiPreview } from './_components/ai-preview';
import { CategoryGrid } from './_components/category-grid';
import { FaqSection } from './_components/faq-section';
import { HomeHero } from './_components/home-hero';
import { HowItWorks } from './_components/how-it-works';
import { PopularItems } from './_components/popular-items';
import { TodayPriceCard } from './_components/today-price-card';
import { TrustSection } from './_components/trust-section';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function HomePage() {
  return (
    <>
      <PageContainer className="grid gap-8 pt-6 pb-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16 lg:pt-14 lg:pb-8">
        <HomeHero />
        <TodayPriceCard />
      </PageContainer>
      <PopularItems />
      <CategoryGrid />
      <AiPreview />
      <HowItWorks />
      <PageContainer className="grid gap-12 py-section lg:grid-cols-2 lg:items-start lg:gap-16">
        <TrustSection />
        <FaqSection />
      </PageContainer>
    </>
  );
}
