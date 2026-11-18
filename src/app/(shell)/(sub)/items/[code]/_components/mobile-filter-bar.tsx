import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ActiveFilterChips } from './active-filter-chips';
import { FilterSheet } from './filter-sheet';
import { countActiveFilters, type PriceFilters } from './price-filters';

/** 모바일 필터 줄: 시트를 여는 필터 버튼과 적용된 조건 칩. */
export function MobileFilterBar({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.filters');
  const count = countActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3 lg:hidden">
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
      <ActiveFilterChips code={code} filters={filters} />
    </div>
  );
}
