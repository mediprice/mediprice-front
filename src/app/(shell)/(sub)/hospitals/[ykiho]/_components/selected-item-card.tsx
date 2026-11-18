'use client';

import {
  ChartLine,
  Check,
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
import { judgeAgainstAverage } from '@/features/npay/average-verdict';
import type { ServiceRegion } from '@/features/regions/service-region';
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
 * 선택한 항목의 이 병원 가격을 화면의 주인공 숫자로 두고, 지역 평균 대비 위치를 문장과 범위 막대로 보여 준다.
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

          <RegionComparison
            price={activeRow.price}
            summary={summary}
            region={region}
          />

          {rows.length > 1 && (
            <fieldset className="flex min-w-0 flex-col">
              <legend className="mb-2 text-label-bold text-text-secondary">
                {t('variants', { count: rows.length })}
              </legend>
              <div
                id={listId}
                className="flex flex-col divide-y divide-hairline overflow-hidden rounded-2xl bg-bg"
              >
                {shownRows?.map((row, index) => {
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
                        onChange={() =>
                          onVariantChange({ name, price: row.price })
                        }
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
                      <span className="ml-auto max-w-full text-price-md wrap-anywhere">
                        {tPrice('won', { amount: row.price })}
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
                  className="mt-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-md text-label-bold text-primary-text hover:underline"
                >
                  {isExpanded
                    ? t('showLess')
                    : t('showAll', { count: rows.length })}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'size-4 transition-transform duration-200 ease-standard',
                      isExpanded && 'rotate-180',
                    )}
                    strokeWidth={1.75}
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
  incomparable: { icon: Info, tone: 'text-text-secondary' },
} as const;

/**
 * "서울·경기 평균보다 12% 저렴해요" 한 문장과, 같은 지역 최저–평균–최고 막대 위의 이 병원 점.
 * 평균의 1/3~3배 밖이면 % 대신 단위·구성이 달라 비교하기 어렵다고 쓴다(목록 행의 꼬리표와 같은 규칙).
 */
function RegionComparison({
  price,
  summary,
  region: regionId,
}: {
  price: number;
  summary: RegionSummaryState;
  region: ServiceRegion;
}) {
  const t = useTranslations('hospitals.detail.selected');
  const region = useTranslations('common.region')(regionId);
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
  const verdict = data ? judgeAgainstAverage(price, data.avgPrice) : null;
  if (!data || !verdict || data.priceCount === 0 || data.avgPrice == null) {
    return (
      <p className="text-body text-text-secondary">
        {t('noRegionPrice', { region })}
      </p>
    );
  }
  const { icon: Icon, tone } =
    verdict.kind === 'comparable'
      ? DIRECTION_STYLE[verdict.comparison.direction]
      : DIRECTION_STYLE.incomparable;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 text-heading text-balance">
        <Icon
          aria-hidden="true"
          className={cn('mt-1 size-5 shrink-0', tone)}
          strokeWidth={2}
        />
        <span>
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
        <p className="text-body-sm text-text-secondary">
          {t('incomparableNote', { average: data.avgPrice })}
        </p>
      )}
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
            {Array.from(
              { length: Math.min(rowCount, VISIBLE_VARIANTS) },
              (_, index) => (
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
              ),
            )}
          </div>
        </div>
      )}
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}
