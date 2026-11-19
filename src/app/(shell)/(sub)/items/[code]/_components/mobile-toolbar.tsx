import { Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import {
  countActiveFilters,
  type PriceFilters,
} from '@/features/npay/price-filters';
import { regionQuery } from '@/features/regions/service-region';

import { FilterSheet } from './filter-sheet';
import { SortSheet } from './sort-sheet';

/** 머리와 목록 사이. 모바일에서 스크롤해도 상단 바 아래에 붙어 있는 필터·지도·정렬 한 줄. 낮은 화면(큰 글자·가로)에서는 본문을 가리지 않게 붙이지 않는다. */
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
    <div className="sticky top-[calc(var(--spacing-top-bar)+env(safe-area-inset-top,0px))] z-(--z-header) -mx-page border-y border-hairline bg-bg lg:hidden [@media(max-height:40rem)]:static">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-2 py-2 px-page">
        <FilterSheet
          code={code}
          filters={filters}
          trigger={
            <button
              type="button"
              aria-label={count > 0 ? t('openWithCount', { count }) : undefined}
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
          aria-label={tMap('openMap')}
          className="touch-target inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-bg px-3 text-label text-text-primary active:bg-surface"
        >
          <MapIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
          {t('mapShort')}
        </Link>
        <div className="ml-auto">
          <SortSheet code={code} filters={filters} />
        </div>
      </div>
    </div>
  );
}
