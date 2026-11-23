import { Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { mapHrefForItem } from '@/features/map/map-params';
import {
  countActiveFilters,
  type PriceFilters,
} from '@/features/npay/price-filters';

import { FilterSheet } from './filter-sheet';
import { SortSheet } from './sort-sheet';

/**
 * 모바일에서 스크롤해도 상단 바 아래에 붙어 있는 필터·지도·정렬 한 줄. 낮은 화면(가로)에서는 본문을 가리지 않게 붙이지 않는다.
 * 큰 글자에서도 줄을 바꾸지 않는다: 폭이 좁으면(rem 컨테이너 쿼리) 필터·지도는 아이콘만 보이고, 그래도 넘치면 옆으로 민다.
 */
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
  const mapHref = mapHrefForItem(code, filters);

  return (
    <div className="sticky top-[calc(var(--spacing-top-bar)+env(safe-area-inset-top,0px))] z-(--z-header) border-b border-hairline bg-bg lg:hidden [@media(max-height:40rem)]:static">
      <div className="@container/toolbar mx-auto flex max-w-page items-center gap-2 overflow-x-auto overscroll-x-contain py-2 px-page md:max-w-2xl">
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
              <span className="@max-[16rem]/toolbar:sr-only">{t('open')}</span>
              {count > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-caption-bold text-on-primary tabular-nums">
                  {count}
                </span>
              )}
            </button>
          }
        />
        <Link
          href={mapHref}
          aria-label={tMap('openMap')}
          className="touch-target inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-bg px-3 text-label text-text-primary active:bg-surface"
        >
          <MapIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
          <span className="@max-[16rem]/toolbar:sr-only">{t('mapShort')}</span>
        </Link>
        <div className="ml-auto shrink-0">
          <SortSheet code={code} filters={filters} />
        </div>
      </div>
    </div>
  );
}
