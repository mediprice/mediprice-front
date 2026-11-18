'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { Check, ChevronDown, Info, Search, SearchX } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import type { VariantSelection } from '@/features/hospitals/detail-links';
import {
  groupPriceRows,
  lastSegment,
  priceRowName,
} from '@/features/hospitals/price-groups';
import { hospitalQueries } from '@/features/hospitals/queries';
import { npayQueries } from '@/features/npay/queries';
import type { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';

import { SectionError } from './section-error';
import { useStickyError } from './use-sticky-error';
import { VariantName } from './variant-name';

type PriceRow = components['schemas']['HospitalItemPriceResponse'];

const SEARCH_DELAY_MS = 300;

export function PriceList({
  ykiho,
  selectedItem,
  selectedRows,
  onSelect,
}: {
  ykiho: string;
  selectedItem: string | null;
  /** 선택한 항목의 행. 아직 불러오지 않은 페이지에 있어도 그 분류의 맨 위에 보인다. */
  selectedRows: readonly PriceRow[] | undefined;
  onSelect: (
    code: string,
    variant: VariantSelection,
    variantCount: number,
  ) => void;
}) {
  const t = useTranslations('hospitals.detail.prices');
  const tActions = useTranslations('common.actions');
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categoryCode, setCategoryCode] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(input.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const categories = useQuery(npayQueries.categories());

  function handleReset() {
    setInput('');
    setKeyword('');
    setCategoryCode('');
  }
  const condition = {
    ...(keyword && { keyword }),
    ...(categoryCode && { categoryCode }),
  };
  const isFiltered = keyword !== '' || categoryCode !== '';
  const list = useInfiniteQuery({
    ...hospitalQueries.priceList(ykiho, condition),
    placeholderData: keepPreviousData,
  });

  const failure = useStickyError(list.error, () => list.refetch());
  const rows = list.data?.pages.flatMap((page) => page.content) ?? [];
  const total = list.data?.pages[0]?.totalElements ?? 0;
  const groups = groupPriceRows(
    rows,
    selectedItem && !isFiltered
      ? { npayCode: selectedItem, rows: selectedRows ?? [] }
      : null,
  );

  return (
    <section
      id="prices"
      aria-labelledby="prices-title"
      className="flex scroll-mt-14 flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <SectionHeader id="prices-title" title={t('title')} />
        <p
          aria-live="polite"
          className="min-h-6.5 text-body text-text-secondary"
        >
          {list.isSuccess &&
            (isFiltered
              ? t('filteredCount', { count: total })
              : t('count', { count: total }))}
        </p>
        {!selectedItem && (
          <p className="text-body-sm text-text-tertiary">{t('hint')}</p>
        )}
      </div>

      <div
        role="search"
        aria-label={t('search')}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label className="flex min-h-12 flex-1 items-center gap-2.5 rounded-xl border border-border-strong bg-bg px-4 transition-colors duration-200 ease-standard focus-within:border-primary focus-within:outline-2 focus-within:outline-focus-ring hover:border-text-tertiary">
          <span className="sr-only">{t('search')}</span>
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-text-tertiary"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t('searchPlaceholder')}
            className="min-h-11 w-full min-w-0 bg-transparent text-field text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </label>
        <label className="relative flex min-h-12 items-center rounded-xl border border-border-strong bg-bg transition-colors duration-200 ease-standard focus-within:border-primary focus-within:outline-2 focus-within:outline-focus-ring hover:border-text-tertiary sm:w-60">
          <span className="sr-only">{t('category')}</span>
          <select
            value={categoryCode}
            aria-busy={categories.isPending || undefined}
            onChange={(event) => setCategoryCode(event.target.value)}
            className="min-h-11 w-full min-w-0 appearance-none truncate bg-transparent pr-10 pl-4 text-field text-text-primary outline-none"
          >
            <option value="">{t('categoryAll')}</option>
            {categories.data?.map((category) => (
              <option key={category.code} value={category.code}>
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 size-5 text-text-tertiary"
            strokeWidth={1.75}
          />
        </label>
      </div>

      {failure.error ? (
        <SectionError
          error={failure.error}
          isRetrying={failure.isRetrying}
          onRetry={() => void failure.retry()}
        />
      ) : list.isPending ? (
        <PriceListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title={isFiltered ? t('noResultTitle') : t('emptyTitle')}
          description={isFiltered ? t('noResultDescription') : undefined}
          action={
            isFiltered ? (
              <Button variant="tint" size="md" onClick={handleReset}>
                {tActions('reset')}
              </Button>
            ) : undefined
          }
          className="rounded-2xl bg-surface py-10"
        />
      ) : (
        <ul
          aria-busy={list.isPlaceholderData || undefined}
          className={cn(
            'flex flex-col gap-8 transition-opacity duration-200 ease-standard',
            list.isPlaceholderData && 'opacity-60',
          )}
        >
          {groups.map((group) => (
            <li key={group.category ?? ''} className="flex flex-col gap-1">
              <h3 className="flex items-baseline justify-between gap-3 border-b border-border pb-2.5 text-subheading">
                {group.category ?? t('otherCategory')}
                <span className="shrink-0 text-label text-text-tertiary">
                  {t('groupCount', { count: group.rows.length })}
                </span>
              </h3>
              <ul className="flex flex-col">
                {group.rows.map((row, index) => {
                  const isSelected = row.npayCode === selectedItem;
                  const joinsPrev =
                    isSelected &&
                    group.rows[index - 1]?.npayCode === selectedItem;
                  const joinsNext =
                    isSelected &&
                    group.rows[index + 1]?.npayCode === selectedItem;
                  return (
                    <li
                      key={`${row.npayCode}-${row.hospitalItemName}-${row.price}-${index}`}
                      data-selected={isSelected || undefined}
                      className={cn(
                        'flex flex-col border-b last:border-b-0',
                        !isSelected &&
                          'border-hairline has-[+li[data-selected]]:border-transparent',
                        isSelected &&
                          (joinsNext
                            ? 'border-primary-tint-pressed'
                            : 'border-transparent'),
                      )}
                    >
                      <PriceRowButton
                        row={row}
                        isSelected={isSelected}
                        joinsPrev={joinsPrev}
                        joinsNext={joinsNext}
                        onSelect={(code, variant) =>
                          onSelect(
                            code,
                            variant,
                            rows.filter((r) => r.npayCode === code).length,
                          )
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {list.hasNextPage && (
        <Button
          variant="outline"
          size="md"
          className="w-full"
          isLoading={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {t('more', { shown: rows.length, total })}
        </Button>
      )}

      <p className="flex items-start gap-1.5 text-caption text-text-secondary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0"
          strokeWidth={1.5}
        />
        {t('source')}
      </p>
    </section>
  );
}

function PriceRowButton({
  row,
  isSelected,
  joinsPrev,
  joinsNext,
  onSelect,
}: {
  row: PriceRow;
  isSelected: boolean;
  /** 선택 항목의 세부 행이 이어지면 모서리를 붙여 한 덩어리 면으로 보이게 한다. */
  joinsPrev: boolean;
  joinsNext: boolean;
  onSelect: (code: string, variant: VariantSelection) => void;
}) {
  const t = useTranslations('hospitals.detail.prices');
  const tPrice = useTranslations('common.price');
  const format = useFormatter();
  const name = priceRowName(row);
  const standardName = lastSegment(row.itemName);

  return (
    <button
      type="button"
      aria-current={isSelected || undefined}
      onClick={() => onSelect(row.npayCode, { name, price: row.price })}
      className={cn(
        '-mx-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl px-3 py-3.5 text-left transition-colors duration-200 ease-standard',
        isSelected
          ? 'bg-primary-tint hover:bg-primary-tint-hover active:bg-primary-tint-pressed'
          : 'hover:bg-surface active:bg-surface-strong',
        joinsPrev && 'rounded-t-none',
        joinsNext && 'rounded-b-none',
      )}
    >
      <span className="flex min-w-0 flex-[1_1_12rem] items-start gap-2">
        {isSelected && (
          <Check
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary-text"
            strokeWidth={2.25}
          />
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              'text-body text-text-primary',
              isSelected && 'font-bold text-primary-text',
            )}
          >
            <VariantName name={name} />
          </span>
          {(standardName !== name || row.startDate) && (
            <span className="text-caption text-text-tertiary">
              {standardName !== name && (
                <span title={row.itemName} className="block">
                  {standardName}
                </span>
              )}
              {row.startDate &&
                t('appliedOn', {
                  date: format.dateTime(new Date(row.startDate), 'dateShort'),
                })}
            </span>
          )}
        </span>
      </span>
      <span className="ml-auto shrink-0 text-price-md whitespace-nowrap">
        {tPrice('won', { amount: row.price })}
      </span>
    </button>
  );
}

const SKELETON_ROWS = 8;

/** 첫 페이지와 같은 행 모양으로 자리를 잡아, 목록이 채워질 때 아래 구역이 화면 안에서 밀려나지 않게 한다. */
function PriceListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-5 w-10" />
      </div>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b border-hairline py-3.5 last:border-b-0"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3.5 w-2/5 min-w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
