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
import { PriceRange } from '@/components/ui/price-range';
import { Skeleton } from '@/components/ui/skeleton';
import { hospitalQueries } from '@/features/hospitals/queries';
import { npayQueries } from '@/features/npay/queries';
import { cn } from '@/lib/utils';

import { SectionError } from './section-error';
import { variantName } from './use-item-prices';

const SEARCH_DELAY_MS = 300;

export function PriceList({
  ykiho,
  selectedItem,
  onSelect,
}: {
  ykiho: string;
  selectedItem: string | null;
  onSelect: (code: string) => void;
}) {
  const t = useTranslations('hospitals.detail.prices');
  const format = useFormatter();
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categoryCode, setCategoryCode] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(input.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const categories = useQuery(npayQueries.categories());
  const condition = {
    ...(keyword && { keyword }),
    ...(categoryCode && { categoryCode }),
  };
  const isFiltered = keyword !== '' || categoryCode !== '';
  const list = useInfiniteQuery({
    ...hospitalQueries.priceList(ykiho, condition),
    placeholderData: keepPreviousData,
  });

  const rows = list.data?.pages.flatMap((page) => page.content) ?? [];
  const total = list.data?.pages[0]?.totalElements ?? 0;

  return (
    <section
      id="prices"
      aria-labelledby="prices-title"
      className="flex scroll-mt-14 flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="prices-title" className="text-heading">
          {t('title')}
        </h2>
        <p
          aria-live="polite"
          className="min-h-6 text-body-sm text-text-secondary"
        >
          {list.isSuccess &&
            (isFiltered
              ? t('filteredCount', { count: total })
              : t('count', { count: total }))}
        </p>
      </div>

      <div
        role="search"
        aria-label={t('search')}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label className="flex min-h-12 flex-1 items-center gap-2.5 rounded-lg bg-surface px-4 focus-within:outline-2 focus-within:outline-focus-ring">
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
        {categories.isSuccess && (
          <label className="relative flex min-h-12 items-center rounded-lg bg-surface focus-within:outline-2 focus-within:outline-focus-ring sm:w-56">
            <span className="sr-only">{t('category')}</span>
            <select
              value={categoryCode}
              onChange={(event) => setCategoryCode(event.target.value)}
              className="min-h-12 w-full min-w-0 appearance-none truncate bg-transparent pr-10 pl-4 text-field text-text-primary outline-none"
            >
              <option value="">{t('categoryAll')}</option>
              {categories.data.map((category) => (
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
        )}
      </div>

      {list.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-18 rounded-lg" />
          ))}
        </div>
      ) : list.isError ? (
        <SectionError error={list.error} onRetry={() => void list.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title={isFiltered ? t('noResultTitle') : t('emptyTitle')}
          description={isFiltered ? t('noResultDescription') : undefined}
          className="rounded-xl bg-surface py-10"
        />
      ) : (
        <ul
          aria-busy={list.isPlaceholderData || undefined}
          className={cn(
            'flex flex-col rounded-xl bg-surface px-2 py-1.5 transition-opacity lg:px-3',
            list.isPlaceholderData && 'opacity-60',
          )}
        >
          {rows.map((row, index) => {
            const isSelected = row.npayCode === selectedItem;
            const name = variantName(row);
            return (
              <li
                key={`${row.npayCode}-${name}-${index}`}
                className="border-b border-border last:border-b-0"
              >
                <button
                  type="button"
                  aria-current={isSelected || undefined}
                  onClick={() => onSelect(row.npayCode)}
                  className={cn(
                    'my-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-surface-strong',
                    isSelected && 'bg-primary-tint hover:bg-primary-tint-hover',
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        'flex items-center gap-1.5 text-label text-text-primary',
                        isSelected && 'text-label-bold text-primary-text',
                      )}
                    >
                      {isSelected && (
                        <Check
                          aria-hidden="true"
                          className="size-4 shrink-0"
                          strokeWidth={2}
                        />
                      )}
                      <span className="min-w-0">{name}</span>
                    </span>
                    <span className="text-caption text-text-tertiary">
                      {name !== row.itemName && (
                        <span className="block">{row.itemName}</span>
                      )}
                      {row.startDate &&
                        t('appliedOn', {
                          date: format.dateTime(
                            new Date(row.startDate),
                            'dateShort',
                          ),
                        })}
                    </span>
                  </span>
                  <PriceRange
                    min={row.price}
                    max={row.price}
                    className="shrink-0 text-label-bold text-text-primary"
                  />
                </button>
              </li>
            );
          })}
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
