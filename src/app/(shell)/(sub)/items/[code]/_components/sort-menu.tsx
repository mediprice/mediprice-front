'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DropdownMenu } from 'radix-ui';

import { type PriceFilters, SORT_LABEL_KEY, SORTS } from './price-filters';
import { useApplyFilters } from './use-apply-filters';

/** 데스크톱 정렬 드롭다운. */
export function SortMenu({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.sort');
  const applyFilters = useApplyFilters(code);
  const currentLabel = t(SORT_LABEL_KEY[filters.sort]);

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label={t('current', { label: currentLabel })}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border-strong bg-bg px-4 text-label text-text-primary hover:bg-surface data-[state=open]:bg-surface"
      >
        {currentLabel}
        <ChevronDown aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-(--z-overlay) min-w-44 rounded-xl border border-hairline bg-bg p-1.5 shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.RadioGroup
            value={filters.sort}
            onValueChange={(value) => {
              const sort = SORTS.find((item) => item === value);
              if (sort && sort !== filters.sort) {
                applyFilters({ ...filters, sort });
              }
            }}
          >
            {SORTS.map((sort) => (
              <DropdownMenu.RadioItem
                key={sort}
                value={sort}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-label text-text-primary outline-none data-highlighted:bg-surface data-[state=checked]:text-label-bold data-[state=checked]:text-primary-text"
              >
                {t(SORT_LABEL_KEY[sort])}
                <DropdownMenu.ItemIndicator>
                  <Check
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={2}
                  />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
