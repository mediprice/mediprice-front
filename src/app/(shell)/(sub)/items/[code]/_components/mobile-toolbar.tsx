import { Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { regionQuery } from '@/features/regions/service-region';

import { FilterSheet } from './filter-sheet';
import { countActiveFilters, type PriceFilters } from './price-filters';
import { SortSheet } from './sort-sheet';

/** 모바일에서 스크롤해도 상단 바 아래에 붙어 있는 필터·정렬 줄. */
export function MobileToolbar({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.filters');
  const tMap = useTranslations('map.entry');
  const count = countActiveFilters(filters);
  const mapQuery = new URLSearchParams({
    item: code,
    ...regionQuery(filters.region),
  }).toString();

  return (
    <div className="sticky top-[calc(var(--spacing-top-bar)+env(safe-area-inset-top,0px))] z-(--z-header) border-b border-hairline bg-bg lg:hidden">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 py-2 px-page">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSheet
            code={code}
            filters={filters}
            trigger={
              <button
                type="button"
                aria-label={
                  count > 0 ? t('openWithCount', { count }) : undefined
                }
                className="touch-target inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-bg px-3 text-label text-text-primary active:bg-surface"
              >
                <SlidersHorizontal
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
                {t('open')}
                {count > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-caption-bold text-on-primary tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            }
          />
          <Link
            href={`/map?${mapQuery}`}
            className="touch-target inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-bg px-3 text-label text-text-primary active:bg-surface"
          >
            <MapIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
            {tMap('openMap')}
          </Link>
        </div>
        <SortSheet code={code} filters={filters} />
      </div>
    </div>
  );
}
