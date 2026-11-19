'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { type PriceFilters, withRegion } from '@/features/npay/price-filters';
import { DEFAULT_REGION } from '@/features/regions/service-region';

import { useApplyFilters } from './use-apply-filters';
import { useFilterLabels } from './use-filter-labels';

/** 적용된 조건을 하나씩 해제하는 칩. 지역을 해제하면 그 안의 시군구도 함께 풀린다. */
export function ActiveFilterChips({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.chips');
  const applyFilters = useApplyFilters(code);
  const labels = useFilterLabels(filters);

  const chips: { id: string; label: string; next: PriceFilters }[] = [];
  if (filters.region !== DEFAULT_REGION) {
    chips.push({
      id: 'region',
      label: labels.region,
      next: withRegion(filters, DEFAULT_REGION),
    });
  }
  if (filters.sggu) {
    chips.push({
      id: 'sggu',
      label: labels.sggu ?? t('sggu'),
      next: { ...filters, sggu: undefined },
    });
  }
  if (filters.institution) {
    chips.push({
      id: 'institution',
      label: labels.institution ?? t('institution'),
      next: { ...filters, institution: undefined },
    });
  }

  return chips.map((chip) => (
    <button
      key={chip.id}
      type="button"
      aria-label={t('remove', { label: chip.label })}
      onClick={() => applyFilters(chip.next, { focusResults: true })}
      className="touch-target inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-primary bg-primary-tint pr-2.5 pl-3 text-label text-primary-text hover:bg-primary-tint-hover active:bg-primary-tint-pressed"
    >
      {chip.label}
      <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
    </button>
  ));
}
