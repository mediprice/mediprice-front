'use client';

import { ArrowDownUp, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';
import {
  type PriceFilters,
  SORT_LABEL_KEY,
  SORTS,
} from '@/features/npay/price-filters';

import { useApplyFilters } from './use-apply-filters';

/** 모바일 정렬 시트. 고르면 바로 적용하고 닫는다. */
export function SortSheet({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.sort');
  const applyFilters = useApplyFilters(code);
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = t(SORT_LABEL_KEY[filters.sort]);

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveDialogTrigger
        aria-label={t('current', { label: currentLabel })}
        className="touch-target inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-bg px-3 text-label text-text-primary active:bg-surface"
      >
        <ArrowDownUp aria-hidden="true" className="size-4" strokeWidth={1.75} />
        {currentLabel}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent title={t('title')}>
        <ul className="-mx-4 flex flex-col">
          {SORTS.map((sort) => {
            const isSelected = sort === filters.sort;
            return (
              <li key={sort}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (!isSelected) applyFilters({ ...filters, sort });
                    setIsOpen(false);
                  }}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-body text-text-primary active:bg-surface aria-pressed:text-label-bold aria-pressed:text-primary-text"
                >
                  {t(SORT_LABEL_KEY[sort])}
                  {isSelected && (
                    <Check
                      aria-hidden="true"
                      className="size-5"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
