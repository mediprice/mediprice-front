import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { Tag } from '@/components/ui/tag';
import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { PopularItemPrice } from '@/features/npay/components/popular-item-card';

type RankedItem = { code: string; name: string };

/** 실제 순위가 이만큼 모여야 순위로 보여 준다. 모자라면 고른 목록(POPULAR_ITEMS)을 순위 없이 보여 준다. */
const ROW_COUNT = 6;

/** ranked는 최근 30일 로그인 이용자가 많이 본 항목(서버가 읽어 넘긴다). 모바일은 3개, md 4개, xl부터 6개를 보여 준다. */
export function PopularItems({
  ranked = [],
}: {
  ranked?: readonly RankedItem[];
}) {
  const t = useTranslations('home');
  const isRanked = ranked.length >= ROW_COUNT;
  const rows = isRanked
    ? ranked.slice(0, ROW_COUNT).map(({ code, name }) => {
        const curated = POPULAR_ITEMS.find((item) => item.code === code);
        return {
          code,
          name,
          category: curated?.category,
          description: curated
            ? t(`popular.items.${curated.id}.description`)
            : null,
        };
      })
    : POPULAR_ITEMS.map((item) => ({
        code: item.code,
        name: t(`popular.items.${item.id}.name`),
        category: item.category,
        description: t(`popular.items.${item.id}.description`),
      }));
  const List = isRanked ? 'ol' : 'ul';
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
          description={
            isRanked ? t('popular.rankedDescription') : t('popular.description')
          }
          action={<div className="hidden md:block">{viewAll}</div>}
        />
        <List className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 [&>li]:min-w-0">
          {rows.map((item, index) => (
            <li
              key={item.code}
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
                  {(isRanked || item.category) && (
                    <span className="flex flex-wrap gap-1.5">
                      {isRanked && (
                        <Tag className="w-fit bg-primary-tint text-primary-text">
                          {t('popular.rank', { rank: index + 1 })}
                        </Tag>
                      )}
                      {item.category && (
                        <Tag className="w-fit">
                          {t(`categories.${item.category}`)}
                        </Tag>
                      )}
                    </span>
                  )}
                  <span className="flex items-center justify-between gap-2 text-heading break-keep">
                    {item.name}
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-text-tertiary"
                      strokeWidth={1.75}
                    />
                  </span>
                  {item.description && (
                    <span className="line-clamp-2 min-h-[2lh] text-body-sm text-text-secondary">
                      {item.description}
                    </span>
                  )}
                </span>
                <PopularItemPrice code={item.code} />
              </Link>
            </li>
          ))}
        </List>
        <div className="md:hidden">{viewAll}</div>
      </PageContainer>
    </section>
  );
}
