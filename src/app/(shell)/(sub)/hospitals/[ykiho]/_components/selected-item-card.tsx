'use client';

import {
  ChartLine,
  Check,
  ChevronRight,
  Equal,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { RangeBar } from '@/components/ui/range-bar';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Skeleton } from '@/components/ui/skeleton';
import { decodeYkiho } from '@/features/hospitals/detail-links';
import { priceRowName } from '@/features/hospitals/price-groups';
import { LiveFeeCheck } from '@/features/live-fee/components/live-fee-check';
import { compareToAverage } from '@/features/npay/average-comparison';
import { DEFAULT_REGION } from '@/features/regions/service-region';
import { cn } from '@/lib/utils';

import { SectionError } from './section-error';
import type {
  ItemPrices,
  PriceTrendState,
  RegionSummaryState,
} from './use-item-prices';
import { useStickyError } from './use-sticky-error';
import { VariantName } from './variant-name';

/** 선택한 항목의 이 병원 가격을 화면의 주인공 숫자로 두고, 서울·경기 평균 대비 위치를 문장과 범위 막대로 보여 준다. */
export function SelectedItemCard({
  item,
  prices,
  trend,
  summary,
  activeVariant,
  expectedRows,
  onVariantChange,
  onClear,
}: {
  item: string;
  prices: ItemPrices;
  trend: PriceTrendState;
  summary: RegionSummaryState;
  activeVariant: string | null;
  /** 불러오는 동안 자리를 잡을 세부 항목 수(목록에서 고른 경우 이미 아는 값). */
  expectedRows: number;
  onVariantChange: (variant: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations('hospitals.detail.selected');
  const tPrice = useTranslations('common.price');
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
      className="flex flex-col gap-5 rounded-3xl bg-surface p-5 outline-none focus-visible:outline-2 md:p-7 lg:p-8"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1 pt-1">
          <p className="text-caption-bold text-primary-text">{t('eyebrow')}</p>
          <h2
            id="selected-item-title"
            className="text-section text-balance break-keep"
          >
            {displayName ?? <Skeleton className="my-1 h-6 w-40" />}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clear')}
          className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors duration-200 ease-standard hover:bg-surface-strong active:bg-border"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      {failure.error ? (
        <SectionError
          error={failure.error}
          onRetry={() => void failure.retry()}
          isRetrying={failure.isRetrying}
          className="bg-bg"
        />
      ) : isLoading || !rows ? (
        <SelectedItemSkeleton rowCount={expectedRows} />
      ) : !activeRow ? (
        <p className="text-body text-text-secondary">{t('notOffered')}</p>
      ) : (
        <>
          <div aria-live="polite" className="flex flex-col gap-1">
            <p className="text-price-hero wrap-anywhere">
              <RollingNumber
                value={activeRow.price}
                format={(amount) => tPrice('won', { amount })}
              />
            </p>
            <p className="text-body-sm text-text-secondary">
              {activeRow.startDate
                ? t('singleMeta', {
                    name: priceRowName(activeRow),
                    date: formatDate(activeRow.startDate),
                  })
                : priceRowName(activeRow)}
            </p>
          </div>

          <RegionComparison price={activeRow.price} summary={summary} />

          {rows.length > 1 && (
            <fieldset className="flex min-w-0 flex-col">
              <legend className="mb-2 text-label-bold text-text-secondary">
                {t('variants', { count: rows.length })}
              </legend>
              <div className="flex flex-col divide-y divide-hairline overflow-hidden rounded-2xl bg-bg">
                {rows.map((row, index) => {
                  const name = priceRowName(row);
                  return (
                    <label
                      key={`${name}-${index}`}
                      className={cn(
                        'flex min-h-14 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors duration-200 ease-standard hover:bg-surface',
                        'has-checked:bg-primary-tint has-checked:hover:bg-primary-tint-hover has-focus-visible:outline-2 has-focus-visible:-outline-offset-4 has-focus-visible:outline-focus-ring',
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
                        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong text-on-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:[&>svg]:opacity-100"
                      >
                        <Check className="size-3 opacity-0" strokeWidth={3} />
                      </span>
                      <span className="flex min-w-0 flex-[1_1_9rem] flex-col gap-0.5 peer-checked:[&>span:first-child]:text-label-bold">
                        <span className="text-label text-text-primary">
                          <VariantName name={name} />
                        </span>
                        {row.startDate && (
                          <span className="text-caption text-text-tertiary">
                            {t('appliedOn', {
                              date: formatDate(row.startDate),
                            })}
                          </span>
                        )}
                      </span>
                      <span className="ml-auto shrink-0 text-price-md whitespace-nowrap">
                        {tPrice('won', { amount: row.price })}
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
        <Button asChild variant="primary" size="lg" className="w-full md:w-fit">
          <Link href={`/items/${item}`}>
            {t('compare')}
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      )}
    </section>
  );
}

const DIRECTION_STYLE = {
  below: { icon: TrendingDown, tone: 'text-positive' },
  above: { icon: TrendingUp, tone: 'text-warning' },
  same: { icon: Equal, tone: 'text-text-primary' },
} as const;

/** "서울·경기 평균보다 12% 저렴해요" 한 문장과, 같은 지역 최저–평균–최고 막대 위의 이 병원 점. */
function RegionComparison({
  price,
  summary,
}: {
  price: number;
  summary: RegionSummaryState;
}) {
  const t = useTranslations('hospitals.detail.selected');
  const region = useTranslations('common.region')(DEFAULT_REGION);
  const failure = useStickyError(summary.error, summary.refetch);

  if (failure.error) {
    return (
      <SectionError
        error={failure.error}
        onRetry={() => void failure.retry()}
        isRetrying={failure.isRetrying}
        className="bg-bg"
      />
    );
  }
  if (summary.isPending) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="my-1 h-6 w-64 max-w-full" />
        <Skeleton className="h-21 w-full max-w-xl" />
      </div>
    );
  }
  const data = summary.data;
  const comparison = data ? compareToAverage(price, data.avgPrice) : null;
  if (!data || !comparison || data.priceCount === 0) {
    return (
      <p className="text-body text-text-secondary">
        {t('noRegionPrice', { region })}
      </p>
    );
  }
  const { icon: Icon, tone } = DIRECTION_STYLE[comparison.direction];

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 text-heading text-balance">
        <Icon
          aria-hidden="true"
          className={cn('mt-1 size-5 shrink-0', tone)}
          strokeWidth={2}
        />
        <span>
          {t.rich('comparison', {
            region,
            direction: comparison.direction,
            percent: comparison.percent,
            em: (chunks) => <span className={tone}>{chunks}</span>,
          })}
        </span>
      </p>
      <RangeBar
        min={data.minPrice}
        max={data.maxPrice}
        average={data.avgPrice}
        value={price}
        className="w-full max-w-xl"
      />
      <p className="text-caption text-text-tertiary">
        {t('basis', { region, count: data.hospitalCount })}
      </p>
    </div>
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
        className="bg-bg"
      />
    );
  }
  if (trend.isPending || trend.summary.kind === 'trend') return null;

  const only = trend.summary.points.at(-1);
  return (
    <p className="flex items-start gap-2 text-body-sm text-text-secondary">
      <ChartLine
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={1.75}
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

/** 가격·비교 문장·막대·세부 항목 행·최신 가격 확인까지 실제 카드와 같은 높이로 자리를 잡는다. */
function SelectedItemSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Skeleton className="my-1 h-10 w-48" />
        <Skeleton className="my-0.5 h-4.5 w-56 max-w-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="my-1 h-6 w-64 max-w-full" />
        <Skeleton className="h-21 w-full max-w-xl" />
      </div>
      {rowCount > 1 && (
        <div className="flex flex-col">
          <Skeleton className="mb-2 h-5 w-24" />
          <div className="flex flex-col divide-y divide-hairline rounded-2xl bg-bg">
            {Array.from({ length: rowCount }, (_, index) => (
              <div
                key={index}
                className="flex min-h-14 items-center gap-3 px-4 py-3"
              >
                <Skeleton className="size-5 rounded-full" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <Skeleton className="h-4.5 w-3/5" />
                  <Skeleton className="h-3.5 w-24" />
                </span>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}
