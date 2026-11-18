import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Chip } from '@/components/ui/chip';
import { POPULAR_ITEMS } from '@/features/npay/catalog';

import { HomeSearchForm } from './home-search-form';

/** 문장형 제목, 큰 검색창, 많이 찾는 검색어, AI 찾기 진입. 데스크톱에서는 오늘의 가격 카드와 나란히 선다. */
export function HomeHero() {
  const t = useTranslations('home');
  return (
    <section aria-labelledby="home-title" className="flex min-w-0 flex-col">
      <h1 id="home-title" className="text-hero text-balance">
        {t('hero.title')}
      </h1>
      <p className="mt-2 text-body text-text-secondary">{t('hero.subtitle')}</p>

      <div className="mt-6 lg:mt-8">
        <HomeSearchForm />
      </div>

      <div className="mt-5">
        <p id="home-popular-searches" className="text-label text-text-tertiary">
          {t('search.popularLabel')}
        </p>
        <ul
          aria-labelledby="home-popular-searches"
          className="mt-3 flex flex-wrap gap-2"
        >
          {POPULAR_ITEMS.map((item) => {
            const name = t(`popular.items.${item.id}.name`);
            return (
              <li key={item.id}>
                <Chip asChild>
                  <Link
                    href={{
                      pathname: '/search',
                      query: { type: 'item', q: name },
                    }}
                  >
                    {name}
                  </Link>
                </Chip>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-6 flex flex-wrap items-center gap-x-1 text-body text-text-secondary">
        {t('ai.question')}
        <Link
          href="/ai"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-label-bold text-primary-text hover:underline"
        >
          <Sparkles aria-hidden="true" className="size-5" strokeWidth={1.75} />
          {t('ai.cta')}
          <ArrowRight
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.75}
          />
        </Link>
      </p>
    </section>
  );
}
