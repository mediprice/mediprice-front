import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

import { HomeSearchForm } from './home-search-form';

export function HomeHero() {
  const t = useTranslations('home');
  return (
    <section
      aria-labelledby="home-title"
      className="rounded-b-4xl bg-linear-to-b from-primary-tint via-hero via-60% to-bg lg:rounded-none"
    >
      <PageContainer className="flex flex-col gap-4 py-8 lg:items-center lg:gap-5 lg:py-16 lg:text-center">
        <p className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-body-sm text-text-secondary">
          <ShieldCheck
            aria-hidden="true"
            className="size-4 text-primary"
            strokeWidth={1.75}
          />
          {t('hero.badge')}
        </p>
        <h1 id="home-title" className="text-hero">
          {t('hero.title')}
        </h1>
        <p className="text-body text-text-secondary">{t('hero.subtitle')}</p>

        <div className="mt-2 w-full lg:flex lg:justify-center">
          <HomeSearchForm />
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
