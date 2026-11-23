import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { openGraphFor } from '@/app/_components/open-graph';
import { ClientMessages } from '@/i18n/client-messages';
import { fetchPopularItems, fetchSiteStats } from '@/server/api/home-data';

import { CategoryGrid } from './_components/category-grid';
import { FaqSection } from './_components/faq-section';
import { HomeHero } from './_components/home-hero';
import { HowItWorks } from './_components/how-it-works';
import { PopularItems } from './_components/popular-items';
import { TrustSection } from './_components/trust-section';

/** 홈은 제목 틀(%s | MediPrice) 없이 서비스 이름과 하는 일을 함께 쓴다. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: { absolute: t('homeTitle') },
    alternates: { canonical: '/' },
    /** 화면이 openGraph를 정하면 루트의 opengraph-image도 빠지므로 같은 그림을 다시 단다. */
    openGraph: {
      ...openGraphFor('/', t('title')),
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: t('ogImage.alt'),
        },
      ],
    },
  };
}

/** 통계와 인기 순위는 서버에서 읽어 넘긴다(10분 캐시). 실패하면 각각 숫자 없이, 고른 목록으로 그린다. */
export default async function HomePage() {
  const [stats, popular] = await Promise.all([
    fetchSiteStats(),
    fetchPopularItems(6),
  ]);
  return (
    <ClientMessages namespaces={['home.popular', 'home.recent']}>
      <HomeHero />
      <CategoryGrid />
      <PopularItems
        ranked={popular.map(({ npayCode, name }) => ({ code: npayCode, name }))}
      />
      <HowItWorks />
      <TrustSection stats={stats} />
      <FaqSection />
    </ClientMessages>
  );
}
