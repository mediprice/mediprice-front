import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { Tag } from '@/components/ui/tag';
import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { PopularItemPrice } from '@/features/npay/components/popular-item-card';

/** 모바일은 Figma처럼 3개, lg부터 6개를 보여 준다. */
export function PopularItems() {
  const t = useTranslations('home');
  const viewAll = (
    <Link
      href={{ pathname: '/search', query: { category: 'all' } }}
      className="inline-flex min-h-11 items-center gap-1 text-label-bold text-text-primary hover:text-primary-text"
    >
      {t('popular.viewAll')}
      <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
    </Link>
  );

  return (
    <section aria-labelledby="home-popular" className="bg-surface">
      <PageContainer className="space-y-4 py-section lg:space-y-6">
        <SectionHeader
          id="home-popular"
          title={t('popular.title')}
          description={t('popular.description')}
          action={<div className="hidden md:block">{viewAll}</div>}
        />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 [&>li]:min-w-0">
          {POPULAR_ITEMS.map((item, index) => (
            <li
              key={item.id}
              className={
                index >= 4
                  ? 'hidden xl:block'
                  : index >= 3
                    ? 'hidden md:block'
                    : ''
              }
            >
              <Link
                href={`/items/${item.code}`}
                className="flex h-full flex-col overflow-hidden rounded-xl pressable bg-bg shadow-card"
              >
                <span className="flex flex-1 flex-col gap-1.5 px-4 pt-4 pb-3.5 lg:px-6 lg:pt-6">
                  <Tag className="w-fit">
                    {t(`categories.${item.category}`)}
                  </Tag>
                  <span className="flex items-center justify-between gap-2 text-heading">
                    {t(`popular.items.${item.id}.name`)}
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-text-tertiary"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="line-clamp-2 min-h-[2lh] text-body-sm text-text-secondary">
                    {t(`popular.items.${item.id}.description`)}
                  </span>
                </span>
                <PopularItemPrice code={item.code} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="md:hidden">{viewAll}</div>
      </PageContainer>
    </section>
  );
}
