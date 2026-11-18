import { CategoryGrid } from './_components/category-grid';
import { FaqSection } from './_components/faq-section';
import { HomeHero } from './_components/home-hero';
import { HowItWorks } from './_components/how-it-works';
import { PopularItems } from './_components/popular-items';
import { TrustSection } from './_components/trust-section';

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <CategoryGrid />
      <PopularItems />
      <HowItWorks />
      <TrustSection />
      <FaqSection />
    </>
  );
}
