import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { HOME_CATEGORIES } from '@/features/npay/catalog';
import { type Region, withRegion } from '@/features/search/search-params';
import type { components } from '@/lib/api/schema';

import { ChipLinks } from './chip-links';

type NpayCategory = components['schemas']['NpayCategoryResponse'];

/** 전체 분류(category=all). 홈 분야 바로가기와 백엔드 대분류 카드 목록이다. */
export function CategoryRoot({
  categories,
  region,
}: {
  categories: readonly NpayCategory[];
  region: Region;
}) {
  const t = useTranslations('search.category');
  return (
    <>
      <PageContainer className="space-y-2 pt-5 pb-4 lg:pt-10 lg:pb-6">
        <h1 className="text-title">{t('root')}</h1>
        <p className="text-body-sm text-text-secondary">
          {t('rootDescription')}
        </p>
        <ChipLinks
          label={t('popular')}
          chips={HOME_CATEGORIES.map(({ id }) => ({
            key: id,
            label: t(`home.${id}`),
            href: {
              pathname: '/search',
              query: withRegion({ category: id }, region),
            },
          }))}
        />
      </PageContainer>

      <section
        aria-labelledby="search-category-list"
        className="bg-surface lg:bg-bg"
      >
        <PageContainer className="space-y-3 pt-5 pb-section lg:pt-2">
          <h2
            id="search-category-list"
            className="text-label-bold text-text-secondary"
          >
            {t('rootCount', { count: categories.length })}
          </h2>
          <ul className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {categories.map((category) => (
              <li key={category.code}>
                <Link
                  href={{
                    pathname: '/search',
                    query: withRegion(
                      { category: 'all', code: category.code },
                      region,
                    ),
                  }}
                  className="flex h-full items-center gap-3 rounded-xl bg-bg py-4 pr-3 pl-4 shadow-card transition-colors hover:bg-hero lg:bg-surface lg:py-5 lg:pl-5 lg:shadow-none lg:hover:bg-primary-tint"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-subheading">
                      {category.name ?? category.code}
                    </span>
                    <span className="block text-body-sm text-text-secondary">
                      {t('subCount', {
                        count: category.subCategories.length,
                      })}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-text-tertiary"
                    strokeWidth={1.75}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>
    </>
  );
}
