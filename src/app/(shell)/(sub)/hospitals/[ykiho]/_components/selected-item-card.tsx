'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ChartLine,
  ChevronDown,
  ChevronRight,
  Equal,
  Info,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PriceRange } from '@/components/ui/price-range';
import { RangeBar } from '@/components/ui/range-bar';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Skeleton } from '@/components/ui/skeleton';
import {
  decodeYkiho,
  type VariantSelection,
} from '@/features/hospitals/detail-links';
import {
  priceRowName,
  visibleVariantRows,
} from '@/features/hospitals/price-groups';
import { LiveFeeCheck } from '@/features/live-fee/components/live-fee-check';
import {
  comparableBand,
  judgeAgainstAverage,
} from '@/features/npay/average-verdict';
import { toPriceConditions } from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';
import type { ServiceRegion } from '@/features/regions/service-region';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

import { SectionError } from './section-error';
import type {
  ItemPrices,
  PriceTrendState,
  RegionSummaryState,
} from './use-item-prices';
import { useStickyError } from './use-sticky-error';
import { VariantName } from './variant-name';

/** 접힌 카드에 보일 세부 항목 수. 아래 "공개 가격" 목록에 모두 있어 카드는 짧게 둔다. */
const VISIBLE_VARIANTS = 3;

type ItemRow = NonNullable<ItemPrices['rows']>[number];

/**
 * 선택한 항목의 이 병원 가격과 지역 평균 대비 위치(문장·범위 막대).
 * 세부 항목은 낮은 가격부터 3개만 두고 나머지는 펼쳐서 본다.
 */
export function SelectedItemCard({
  item,
  prices,
  trend,
  summary,
  region,
  activeRow,
  expectedRows,
  onVariantChange,
  onClear,
  onBackToList,
}: {
  item: string;
  prices: ItemPrices;
  trend: PriceTrendState;
  summary: RegionSummaryState;
  /** 평균을 낸 지역. 항목 가격 목록에서 왔으면 그 목록의 지역이다. */
  region: ServiceRegion;
  /** 지금 고른 세부 항목 행(prices.rows 중 하나). */
  activeRow: ItemRow | undefined;
  /** 불러오는 동안 자리를 잡을 세부 항목 수(목록에서 고른 경우 이미 아는 값). */
  expectedRows: number;
  onVariantChange: (variant: VariantSelection) => void;
  onClear: () => void;
  /** 아래 목록에서 골랐을 때만 있다. 고른 행으로 돌아간다. */
  onBackToList?: () => void;
}) {
  const t = useTranslations('hospitals.detail.selected');
  const tPrice = useTranslations('common.price');
  const ykiho = decodeYkiho(useParams<{ ykiho: string }>().ykiho);
  const format = useFormatter();
  const listId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const { displayName, rows } = prices;
  const failure = useStickyError(prices.error, prices.refetch);
  const formatDate = (date: string) =>
    format.dateTime(new Date(date), 'dateShort');
  const shownRows =
    rows && !isExpanded
      ? visibleVariantRows(rows, activeRow, VISIBLE_VARIANTS)
      : rows;
  const isLoading =
    prices.isPending || !rows || (trend.isPending && !trend.error);
  /** 주소에 남은 옛 항목 코드처럼 더 이상 없는 항목이면 다시 시도해도 소용없다. */
  const isMissing =
    failure.error instanceof ApiError &&
    (failure.error.code === 'NPAY_ITEM_NOT_FOUND' ||
      failure.error.status === 404);

  return (
    <section
      id="selected-item"
      tabIndex={-1}
      aria-labelledby="selected-item-title"
      aria-busy={isLoading || undefined}
      className="flex scroll-mt-14 flex-col gap-4 rounded-xl border border-primary/30 bg-bg px-5 py-5 outline-none focus-visible:outline-2 max-[22rem]:px-4 lg:px-6 lg:py-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="selected-item-title"
          className="min-w-0 pt-2.5 text-label-bold break-keep text-primary-text"
        >
          {displayName ? (
            t('label', { name: displayName })
          ) : isMissing ? (
            t('missingLabel')
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

      {onBackToList && (
        <button
          type="button"
          onClick={onBackToList}
          className="-mt-3 inline-flex min-h-11 w-fit items-center gap-1 text-label-bold text-primary-text hover:underline"
        >
          <ArrowDown aria-hidden="true" className="size-4" strokeWidth={2} />
          {t('backToList')}
        </button>
      )}

      {isMissing ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-body-sm text-text-secondary">{t('missing')}</p>
          <Button variant="outline" size="md" onClick={onClear}>
            {t('clear')}
          </Button>
        </div>
      ) : failure.error ? (
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
          <div aria-live="polite" className="flex min-w-0 flex-col gap-1">
            <p className="text-price-xl wrap-anywhere text-text-primary">
              <RollingNumber
                value={activeRow.price}
                format={(amount) => tPrice('won', { amount })}
              />
            </p>
            <p className="text-caption text-text-secondary">
              {activeRow.startDate
                ? t('singleMeta', {
                    name: priceRowName(activeRow),
                    date: formatDate(activeRow.startDate),
                  })
                : priceRowName(activeRow)}
            </p>
          </div>

          <RegionComparison
            item={item}
            price={activeRow.price}
            summary={summary}
            region={region}
          />

          {rows.length > 1 && (
            <fieldset className="flex min-w-0 flex-col">
              <legend className="mb-2 text-caption-strong text-text-secondary">
                {t('variants', { count: rows.length })}
              </legend>
              <div
                id={listId}
                className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg"
              >
                {shownRows?.map((row, index) => {
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
                        onChange={() =>
                          onVariantChange({ name, price: row.price })
                        }
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
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-caption text-text-tertiary">
                            {row.startDate &&
                              t('appliedOn', {
                                date: formatDate(row.startDate),
                              })}
                          </span>
                          <PriceRange
                            min={row.price}
                            max={row.price}
                            className="ml-auto max-w-full text-label-bold wrap-anywhere text-text-primary"
                          />
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {rows.length > VISIBLE_VARIANTS && (
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={listId}
                  onClick={() => setIsExpanded((value) => !value)}
                  className="mt-1 inline-flex min-h-11 w-fit items-center gap-1 text-label-bold text-primary-text hover:underline"
                >
                  {isExpanded
                    ? t('showLess')
                    : t('showAll', { count: rows.length })}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'size-4 transition-transform duration-200 ease-standard motion-reduce:transition-none',
                      isExpanded && 'rotate-180',
                    )}
                    strokeWidth={2}
                  />
                </button>
              )}
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

      {!isLoading && !isMissing && (
        <Link
          href={`/items/${item}`}
          className="inline-flex min-h-11 w-fit items-center gap-1 text-label-bold text-primary-text hover:underline"
        >
          {t('compare')}
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2} />
        </Link>
      )}
    </section>
  );
}

const DIRECTION_STYLE = {
  below: { icon: TrendingDown, tone: 'text-positive' },
  above: { icon: TrendingUp, tone: 'text-warning' },
  same: { icon: Equal, tone: 'text-text-primary' },
  incomparable: { icon: Info, tone: 'text-text-secondary' },
} as const;

/**
 * "서울·경기 평균보다 12% 저렴해요" 한 문장과, 같은 지역 최저–평균–최고 막대 위의 이 병원 점.
 * 평균의 1/3~3배 밖이면 % 대신 단위·구성이 달라 비교하기 어렵다고 쓴다(목록 행의 꼬리표와 같은 규칙).
 */
function RegionComparison({
  item,
  price,
  summary,
  region: regionId,
}: {
  item: string;
  price: number;
  summary: RegionSummaryState;
  region: ServiceRegion;
}) {
  const t = useTranslations('hospitals.detail.selected');
  const region = useTranslations('common.region')(regionId);
  const failure = useStickyError(summary.error, summary.refetch);
  /** 막대의 최저~최고와 병원 수는 항목 목록과 같은 "평균과 견줄 수 있는 가격" 범위로 그린다(1일당 1,000원 같은 극단값 제외). */
  const band = comparableBand(summary.data?.avgPrice);
  const comparable = useQuery({
    ...npayQueries.summaryOf(
      item,
      toPriceConditions({ region: regionId, sort: 'price_asc' }, band),
    ),
    enabled: band !== null,
  });

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
  if (summary.isPending || (band !== null && comparable.isPending)) {
    return <RegionComparisonSkeleton />;
  }
  const data = summary.data;
  const verdict = data ? judgeAgainstAverage(price, data.avgPrice) : null;
  if (!data || !verdict || data.priceCount === 0 || data.avgPrice == null) {
    return (
      <p className="text-body-sm text-text-secondary">
        {t('noRegionPrice', { region })}
      </p>
    );
  }
  /** 비교할 수 없는 가격(범위 밖)이면 점이 범위 안에 없으므로 전체 범위를 그대로 보여 준다. */
  const scope =
    verdict.kind === 'comparable' && comparable.data ? comparable.data : data;
  const { icon: Icon, tone } =
    verdict.kind === 'comparable'
      ? DIRECTION_STYLE[verdict.comparison.direction]
      : DIRECTION_STYLE.incomparable;

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface px-4 py-4">
      <p className="flex items-start gap-2 text-subheading text-balance break-keep">
        <Icon
          aria-hidden="true"
          className={cn('mt-0.5 size-5 shrink-0', tone)}
          strokeWidth={2}
        />
        <span className="min-w-0">
          {verdict.kind === 'comparable'
            ? t.rich('comparison', {
                region,
                direction: verdict.comparison.direction,
                percent: verdict.comparison.percent,
                em: (chunks) => <span className={tone}>{chunks}</span>,
              })
            : t('incomparable', { region })}
        </span>
      </p>
      {verdict.kind === 'incomparable' && (
        <p className="text-caption text-text-secondary">
          {t('incomparableNote', { average: data.avgPrice })}
        </p>
      )}
      <RangeBar
        min={scope.minPrice}
        max={scope.maxPrice}
        average={data.avgPrice}
        value={price}
        isComparable={verdict.kind !== 'incomparable'}
        className="w-full"
      />
      <p className="text-caption text-text-tertiary">
        {t(scope === data ? 'basis' : 'comparableBasis', {
          region,
          count: scope.hospitalCount,
        })}
      </p>
    </div>
  );
}

function RegionComparisonSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-lg bg-surface px-4 py-4"
    >
      <Skeleton className="my-0.5 h-6 w-64 max-w-full" />
      <Skeleton className="h-21 w-full" />
      <Skeleton className="h-4 w-48 max-w-full" />
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
        className="bg-surface"
      />
    );
  }
  if (trend.isPending || trend.summary.kind === 'trend') return null;

  const only = trend.summary.points.at(-1);
  return (
    <p className="flex items-start gap-1.5 text-caption text-text-secondary">
      <ChartLine
        aria-hidden="true"
        className="mt-0.5 size-3.5 shrink-0"
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

/** 가격·비교·세부 항목 행·최신 가격 확인 버튼·비교 링크까지 실제 카드와 같은 높이로 자리를 잡는다. */
function SelectedItemSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="my-1 h-6.5 w-40" />
        <Skeleton className="my-0.5 h-3.75 w-56 max-w-full" />
      </div>
      <RegionComparisonSkeleton />
      {rowCount > 1 && (
        <div className="flex flex-col">
          <Skeleton className="mb-2 h-4.75 w-20" />
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg">
            {Array.from(
              { length: Math.min(rowCount, VISIBLE_VARIANTS) },
              (_, index) => (
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
              ),
            )}
          </div>
        </div>
      )}
      <Skeleton className="h-4.75 w-52 max-w-full" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-11 w-full rounded-lg lg:w-48" />
        <Skeleton className="h-4.75 w-64 max-w-full" />
      </div>
      <Skeleton className="h-11 w-40" />
    </div>
  );
}
