'use client';

import { ChartLine, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';

import { PriceRange } from '@/components/ui/price-range';
import { Skeleton } from '@/components/ui/skeleton';
import { decodeYkiho } from '@/features/hospitals/detail-links';
import { priceRowName } from '@/features/hospitals/price-groups';
import { LiveFeeCheck } from '@/features/live-fee/components/live-fee-check';
import { cn } from '@/lib/utils';

import { SectionError } from './section-error';
import type { ItemPrices, PriceTrendState } from './use-item-prices';
import { useStickyError } from './use-sticky-error';
import { VariantName } from './variant-name';

export function SelectedItemCard({
  item,
  prices,
  trend,
  activeVariant,
  expectedRows,
  onVariantChange,
  onClear,
}: {
  item: string;
  prices: ItemPrices;
  trend: PriceTrendState;
  activeVariant: string | null;
  /** 불러오는 동안 자리를 잡을 세부 항목 수(목록에서 고른 경우 이미 아는 값). */
  expectedRows: number;
  onVariantChange: (variant: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations('hospitals.detail.selected');
  const ykiho = decodeYkiho(useParams<{ ykiho: string }>().ykiho);
  const format = useFormatter();
  const { displayName, rows } = prices;
  const failure = useStickyError(prices.error, prices.refetch);
  const formatDate = (date: string) =>
    format.dateTime(new Date(date), 'dateShort');
  const activeRow =
    rows?.find((row) => priceRowName(row) === activeVariant) ?? rows?.[0];
  const isLoading =
    prices.isPending || !rows || (trend.isPending && !trend.error);

  return (
    <section
      id="selected-item"
      tabIndex={-1}
      aria-labelledby="selected-item-title"
      aria-busy={isLoading || undefined}
      className="flex scroll-mt-14 flex-col gap-3 rounded-xl border border-primary/30 bg-bg px-5 py-5 outline-none focus-visible:outline-2 lg:px-7 lg:py-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="selected-item-title"
          className="min-w-0 pt-2.5 text-label-bold text-primary-text"
        >
          {displayName ? (
            t('label', { name: displayName })
          ) : (
            <Skeleton className="h-5 w-40" />
          )}
        </h2>
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clear')}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface active:bg-surface-strong"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      {failure.error ? (
        <SectionError
          error={failure.error}
          onRetry={() => void failure.retry()}
          isRetrying={failure.isRetrying}
          className="bg-surface"
        />
      ) : isLoading || !rows ? (
        <SelectedItemSkeleton rowCount={expectedRows} />
      ) : !activeRow ? (
        <p className="text-body-sm text-text-secondary">{t('notOffered')}</p>
      ) : (
        <>
          <div aria-live="polite" className="flex flex-col gap-1">
            <PriceRange
              min={activeRow.price}
              max={activeRow.price}
              className="text-price-xl text-text-primary"
            />
            <p className="text-caption text-text-secondary">
              {activeRow.startDate
                ? t('singleMeta', {
                    name: priceRowName(activeRow),
                    date: formatDate(activeRow.startDate),
                  })
                : priceRowName(activeRow)}
            </p>
          </div>

          {rows.length > 1 && (
            <fieldset className="flex flex-col">
              <legend className="mb-2 text-caption-strong text-text-secondary">
                {t('variants', { count: rows.length })}
              </legend>
              <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg">
                {rows.map((row, index) => {
                  const name = priceRowName(row);
                  return (
                    <label
                      key={`${name}-${index}`}
                      className={cn(
                        'flex min-h-12 cursor-pointer items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0 hover:bg-surface',
                        'has-checked:bg-primary-tint has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-focus-ring',
                      )}
                    >
                      <input
                        type="radio"
                        name={`variant-${item}`}
                        value={name}
                        checked={row === activeRow}
                        onChange={() => onVariantChange(name)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong peer-checked:border-primary peer-checked:[&>span]:opacity-100"
                      >
                        <span className="size-2.5 rounded-full bg-primary opacity-0" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col peer-checked:[&>span:first-child]:text-label-bold">
                        <span className="text-label text-text-primary">
                          <VariantName name={name} />
                        </span>
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="text-caption text-text-tertiary">
                            {row.startDate &&
                              t('appliedOn', {
                                date: formatDate(row.startDate),
                              })}
                          </span>
                          <PriceRange
                            min={row.price}
                            max={row.price}
                            className="shrink-0 text-label-bold text-text-primary"
                          />
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <TrendNote trend={trend} />

          <LiveFeeCheck
            key={`${ykiho}:${item}`}
            ykiho={ykiho}
            npayCode={item}
          />
        </>
      )}

      {!isLoading && (
        <Link
          href={`/items/${item}`}
          className="inline-flex min-h-11 w-fit items-center gap-1 text-label-bold text-primary-text hover:underline lg:hidden"
        >
          {t('compare')}
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
        </Link>
      )}
    </section>
  );
}

/** 추이를 그릴 만큼 기록이 없을 때 차트 대신 보여 주는 한 줄. 두 달 이상이면 차트 카드가 따로 뜬다. */
function TrendNote({ trend }: { trend: PriceTrendState }) {
  const t = useTranslations('hospitals.detail.trend');
  const format = useFormatter();
  const failure = useStickyError(trend.error, trend.refetch);

  if (failure.error) {
    return (
      <SectionError
        error={failure.error}
        onRetry={() => void failure.retry()}
        isRetrying={failure.isRetrying}
        className="bg-surface"
      />
    );
  }
  if (trend.isPending || trend.summary.kind === 'trend') return null;

  const only = trend.summary.points.at(-1);
  return (
    <p className="flex items-center gap-1.5 text-caption text-text-secondary">
      <ChartLine
        aria-hidden="true"
        className="size-3.5 shrink-0"
        strokeWidth={1.5}
      />
      {only
        ? t('onlyMonth', {
            month: format.dateTime(only.date, {
              year: 'numeric',
              month: 'long',
            }),
          })
        : t('none')}
    </p>
  );
}

/** 가격·세부 항목 행·추이 한 줄·최신 가격 확인 버튼·비교 링크까지 실제 카드와 같은 높이로 자리를 잡는다. */
function SelectedItemSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Skeleton className="my-1 h-6.5 w-40" />
        <Skeleton className="my-0.5 h-3.75 w-56" />
      </div>
      {rowCount > 1 && (
        <div className="flex flex-col">
          <Skeleton className="mb-2 h-4.75 w-20" />
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg">
            {Array.from({ length: rowCount }, (_, index) => (
              <div
                key={index}
                className="flex min-h-12 items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0"
              >
                <Skeleton className="size-5 rounded-full" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <Skeleton className="my-0.5 h-4.5 w-3/5" />
                  <span className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="my-0.5 h-4.5 w-16" />
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Skeleton className="h-4.75 w-52" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-11 w-full rounded-lg lg:w-48" />
        <Skeleton className="h-4.75 w-64 max-w-full" />
      </div>
      <Skeleton className="h-11 w-40 lg:hidden" />
    </div>
  );
}
