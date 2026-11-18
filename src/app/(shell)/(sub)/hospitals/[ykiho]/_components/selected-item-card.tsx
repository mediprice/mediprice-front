'use client';

import { Check, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

import { PriceRange } from '@/components/ui/price-range';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { cn } from '@/lib/utils';

import { SectionError } from './section-error';
import { useItemPrices, variantName } from './use-item-prices';

const CARD =
  'flex scroll-mt-14 flex-col gap-3 rounded-xl bg-primary-tint px-5 py-5 outline-none focus-visible:outline-2 lg:px-7 lg:py-6';

export function SelectedItemCard({
  ykiho,
  item,
  variant,
  onVariantChange,
  onClear,
}: {
  ykiho: string;
  item: string | null;
  variant: string | null;
  onVariantChange: (variant: string | null) => void;
  onClear: () => void;
}) {
  const t = useTranslations('hospitals.detail.selected');
  const format = useFormatter();
  const { displayName, rows, isPending, error, refetch } = useItemPrices(
    ykiho,
    item,
  );

  if (!item) {
    return (
      <section
        id="selected-item"
        tabIndex={-1}
        aria-labelledby="selected-item-title"
        className={cn(CARD, 'bg-surface')}
      >
        <h2 id="selected-item-title" className="text-subheading">
          {t('emptyTitle')}
        </h2>
        <p className="text-body-sm text-text-secondary">
          {t('emptyDescription')}
        </p>
      </section>
    );
  }

  const formatDate = (date: string) =>
    format.dateTime(new Date(date), 'dateShort');
  const selectedRow = rows?.find((row) => variantName(row) === variant);
  const prices = rows?.map((row) => row.price) ?? [];
  const latestDate = rows
    ?.map((row) => row.startDate)
    .filter((date): date is string => date != null)
    .sort()
    .at(-1);
  const hasVariants = (rows?.length ?? 0) > 1;

  function describeRows() {
    const row = selectedRow ?? (hasVariants ? undefined : rows?.[0]);
    if (row) {
      return row.startDate
        ? t('singleMeta', {
            name: variantName(row),
            date: formatDate(row.startDate),
          })
        : t('singleMetaNoDate', { name: variantName(row) });
    }
    const count = rows?.length ?? 0;
    return latestDate
      ? t('rangeMeta', { count, date: formatDate(latestDate) })
      : t('rangeMetaNoDate', { count });
  }

  return (
    <section
      id="selected-item"
      tabIndex={-1}
      aria-labelledby="selected-item-title"
      aria-busy={isPending || undefined}
      className={CARD}
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="selected-item-title"
          className="min-w-0 pt-2.5 text-label-bold text-primary-text"
        >
          {displayName ? (
            t('label', { name: displayName })
          ) : (
            <Skeleton className="h-5 w-40 bg-primary-tint-pressed" />
          )}
        </h2>
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clear')}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-tint-hover active:bg-primary-tint-pressed"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      {error ? (
        <SectionError error={error} onRetry={refetch} className="bg-bg" />
      ) : isPending || !rows ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-48 bg-primary-tint-pressed" />
          <Skeleton className="h-5 w-56 bg-primary-tint-pressed" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-body-sm text-text-secondary">{t('notOffered')}</p>
      ) : (
        <>
          {hasVariants && (
            <div
              role="group"
              aria-label={t('variants')}
              className="flex flex-wrap gap-2"
            >
              {rows.map((row, index) => {
                const name = variantName(row);
                const isSelected = name === variant;
                return (
                  <button
                    key={`${name}-${index}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onVariantChange(isSelected ? null : name)}
                    className={cn(
                      'touch-target inline-flex min-h-9 max-w-full items-center gap-1 rounded-full border px-3.5 py-1 text-left text-label transition-colors',
                      isSelected
                        ? 'border-primary bg-bg text-label-bold text-primary-text'
                        : 'border-border bg-bg text-text-secondary hover:border-border-strong',
                    )}
                  >
                    {isSelected && (
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0"
                        strokeWidth={2}
                      />
                    )}
                    {name}
                  </button>
                );
              })}
            </div>
          )}
          <p aria-live="polite" className="text-price-xl text-text-primary">
            {selectedRow ? (
              <PriceRange min={selectedRow.price} max={selectedRow.price} />
            ) : (
              <PriceRange min={Math.min(...prices)} max={Math.max(...prices)} />
            )}
          </p>
          {hasVariants && !selectedRow && (
            <StatusChip status="warning">{t('variantsDiffer')}</StatusChip>
          )}
          <p className="text-caption text-text-secondary">{describeRows()}</p>
        </>
      )}

      <Link
        href={`/items/${item}`}
        className="inline-flex min-h-11 w-fit items-center gap-1 text-label-bold text-primary-text hover:underline lg:hidden"
      >
        {t('compare')}
        <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
      </Link>
    </section>
  );
}
