import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

import { HomeSearchForm } from './home-search-form';
import { RecentItemChips } from './recent-item-chips';

export function HomeHero() {
  const t = useTranslations('home');
  return (
    <section
      aria-labelledby="home-title"
      className="rounded-b-4xl bg-primary-tint lg:rounded-none"
    >
      <PageContainer className="flex flex-col gap-4 py-8 lg:items-center lg:gap-5 lg:py-16 lg:text-center">
        <h1 id="home-title" className="text-hero">
          {t('hero.title')}
        </h1>
        <p className="text-body text-text-secondary">{t('hero.subtitle')}</p>

        <div className="mt-2 flex w-full flex-col gap-3 md:items-center">
          <HomeSearchForm />
          <RecentItemChips />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6 lg:mt-2 lg:flex-row lg:items-center lg:gap-4 lg:border-t-0 lg:pt-0">
          <div className="space-y-1 lg:flex lg:items-baseline lg:gap-2 lg:space-y-0">
            <p className="text-subheading">{t('ai.title')}</p>
            <p className="text-body-sm text-text-secondary">
              {t('ai.description')}
            </p>
          </div>
          <Button asChild variant="tint" className="w-full lg:w-auto">
            <Link href="/ai">
              {t('ai.cta')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}
