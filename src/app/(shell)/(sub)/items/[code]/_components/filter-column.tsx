'use client';

import { Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  clearConditions,
  countActiveFilters,
  type PriceFilters,
} from '@/features/npay/price-filters';
import { regionQuery } from '@/features/regions/service-region';

import { FilterPanel } from './filter-panel';
import { useApplyFilters } from './use-apply-filters';

/** 데스크톱 왼쪽 필터 열. 열이 늘 보이므로 고르는 즉시 적용한다. */
export function FilterColumn({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.filters');
  const applyFilters = useApplyFilters(code);
  const tMap = useTranslations('map.entry');
  const mapQuery = new URLSearchParams({
    item: code,
    ...regionQuery(filters.region),
  }).toString();

  return (
    <aside
      aria-labelledby="item-filters-title"
      className="sticky top-24 hidden w-70 shrink-0 self-start rounded-xl bg-bg p-6 shadow-card lg:block"
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 id="item-filters-title" className="text-heading">
          {t('title')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={countActiveFilters(filters) === 0}
          onClick={() =>
            applyFilters(clearConditions(filters), { focusResults: true })
          }
        >
          {t('reset')}
        </Button>
      </div>
      <FilterPanel value={filters} onChange={applyFilters} />
      <Button asChild variant="outline" size="md" className="mt-5 w-full">
        <Link href={`/map?${mapQuery}`}>
          <MapIcon aria-hidden="true" />
          {tMap('openMap')}
        </Link>
      </Button>
    </aside>
  );
}
