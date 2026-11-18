'use client';

import { ArrowDownUp, Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DropdownMenu } from 'radix-ui';
import { useState } from 'react';

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog';

import { type PriceFilters, type PriceSort, SORTS } from './price-filters';
import { useApplyFilters } from './use-apply-filters';

const SORT_LABEL_KEY = {
  price_asc: 'priceAsc',
  price_desc: 'priceDesc',
} as const satisfies Record<PriceSort, string>;

const TRIGGER_CLASS =
  'inline-flex min-h-11 items-center gap-1.5 rounded-lg text-label text-text-secondary hover:text-text-primary active:bg-surface';

/** 모바일은 바텀시트, 데스크톱은 드롭다운 메뉴. 둘 다 렌더하고 CSS로 하나만 보인다. */
export function SortControl({
  code,
  filters,
}: {
  code: string;
  filters: PriceFilters;
}) {
  const t = useTranslations('items.sort');
  const applyFilters = useApplyFilters(code);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const currentLabel = t(SORT_LABEL_KEY[filters.sort]);

  function select(sort: PriceSort) {
    if (sort !== filters.sort) applyFilters({ ...filters, sort });
  }

  return (
    <>
      <div className="lg:hidden">
        <ResponsiveDialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <ResponsiveDialogTrigger
            aria-label={t('current', { label: currentLabel })}
            className={TRIGGER_CLASS}
          >
            <ArrowDownUp
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.75}
            />
            {currentLabel}
            <ChevronDown
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.75}
            />
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
                        select(sort);
                        setIsSheetOpen(false);
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
      </div>

      <div className="hidden lg:block">
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger
            aria-label={t('current', { label: currentLabel })}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-strong bg-bg px-4 text-label text-text-primary hover:bg-surface data-[state=open]:bg-surface"
          >
            {currentLabel}
            <ChevronDown
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.75}
            />
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
                  if (sort) select(sort);
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
      </div>
    </>
  );
}
