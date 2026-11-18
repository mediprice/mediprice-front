'use client';

import { ArrowDown, ArrowUp, ChevronDown, Equal } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { RangeBar } from '@/components/ui/range-bar';
import { CompareToggle } from '@/features/comparison/components/compare-toggle';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { HospitalIdentity } from '@/features/hospitals/components/hospital-identity';
import { formatLocation } from '@/features/regions/format-location';
import { cn } from '@/lib/utils';

import {
  type AverageComparison,
  compareToAverage,
} from '../average-comparison';
import type { HospitalPriceGroup } from '../group-prices';
import type { HospitalPrice, PriceSortOrder } from '../price-stream';
import type { PriceSummary } from '../price-summary';
import { representativePrice } from '../representative-price';

/**
 * 항목별 가격 목록의 병원 한 행. 오른쪽에 대표 가격(정렬 기준 쪽 끝)을 크게 쓰고, 그 아래 줄에 "평균보다 N% 저렴" 꼬리표와
 * 작은 범위 막대를 나란히 둔다. 막대의 점은 대표 가격, 세로 눈금은 같은 조건의 평균, 막대 양 끝은 같은 조건의 최저·최고다.
 * 병원 안의 최저~최고는 막대에 구간으로 그리지 않는다. 극단값 때문에 막대 폭의 1–2%라 보이지 않아서 반대쪽 끝을 글자로 쓴다.
 * 행 전체는 병원 이름 링크가 덮고, 펼치기·관심·비교함 버튼만 그 위(relative z-10)에 올린다. 목록이 구분선(divide-y divide-hairline)을 준다.
 */
export function HospitalPriceGroupCard<T extends string>({
  group,
  href,
  summary,
  sort = 'price_asc',
}: {
  group: HospitalPriceGroup;
  href: Route<T>;
  /** 같은 조건의 항목 요약. 있으면 평균 대비 꼬리표와 범위 막대를 보여 준다. */
  summary?: Pick<PriceSummary, 'minPrice' | 'maxPrice' | 'avgPrice'>;
  /** 목록 정렬. 대표 가격을 정렬 기준과 같은 쪽 끝으로 고른다. */
  sort?: PriceSortOrder;
}) {
  const t = useTranslations('items.card');
  const tPrice = useTranslations('common.price');
  /** 항목 가격 화면(/items/[code])에서만 쓰여 경로의 항목 코드를 비교함에 함께 담는다. */
  const { code: itemCode } = useParams<{ code?: string }>();
  const listId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const location = formatLocation(group.sidoName, group.sgguName);
  const meta =
    group.className && location
      ? t('meta', { kind: group.className, region: location })
      : group.className || location;
  const [firstVariant] = group.variants;
  const extraCount = group.variants.length - 1;
  const { price, other } = representativePrice(group, sort);
  const comparison = summary
    ? compareToAverage(price, summary.avgPrice, {
        sameWithinPercent: SAME_WITHIN_PERCENT,
      })
    : null;

  return (
    <article className="relative flex flex-col gap-3 px-4 pt-5 pb-3 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface md:px-6 md:pt-6 md:pb-4">
      {/** 큰 글자로 이름 칸이 9rem보다 좁아지면 가격이 이름 아래 줄로 내려간다. */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1 md:gap-x-8">
        <HospitalIdentity
          as="h3"
          className="min-w-[min(100%,9rem)] flex-1"
          meta={meta}
          name={
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 hover:text-primary-text"
            >
              {group.hospitalName}
            </Link>
          }
        />
        <p className="ml-auto flex flex-col items-end text-right">
          <span className="text-price-lg">
            {tPrice('won', { amount: price })}
          </span>
          {other && (
            <span className="text-body-sm text-text-tertiary tabular-nums">
              {other.kind === 'maximum'
                ? tPrice('maximum', { amount: other.price })
                : tPrice('minimum', { amount: other.price })}
            </span>
          )}
        </p>
      </div>

      {comparison && summary && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:justify-end">
          <AverageTag comparison={comparison} />
          <div aria-hidden="true" className="w-28 md:w-40">
            <RangeBar
              size="sm"
              min={summary.minPrice}
              max={summary.maxPrice}
              average={summary.avgPrice}
              value={price}
            />
          </div>
        </div>
      )}

      {firstVariant && (
        <div className="flex flex-wrap items-center gap-x-3">
          {isExpanded ? (
            <ul
              id={listId}
              aria-label={t('variantsLabel', { hospital: group.hospitalName })}
              className="relative z-10 mb-1 flex basis-full flex-col divide-y divide-hairline rounded-xl border border-border bg-bg px-3"
            >
              {group.variants.map((variant, index) => (
                <li key={index}>
                  <VariantRow variant={variant} />
                </li>
              ))}
            </ul>
          ) : (
            <p
              id={listId}
              className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 text-body-sm text-text-secondary"
            >
              {firstVariant.itemName && (
                <span className="min-w-0">{firstVariant.itemName}</span>
              )}
              {extraCount > 0 ? (
                <span className="text-text-tertiary">
                  {t('moreVariants', { count: extraCount })}
                </span>
              ) : (
                <VariantDate startDate={firstVariant.startDate} />
              )}
            </p>
          )}
          {extraCount > 0 && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={listId}
              onClick={() => setIsExpanded((value) => !value)}
              className="relative z-10 inline-flex min-h-11 w-fit items-center gap-1 rounded-md text-label text-primary-text hover:underline"
            >
              {isExpanded
                ? t('hideVariants')
                : t('showVariants', { count: group.variants.length })}
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
          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
            <FavoriteButton
              ykiho={group.ykiho}
              hospital={{
                name: group.hospitalName,
                className: group.className,
                address: null,
                phone: null,
              }}
              variant="icon"
            />
            <CompareToggle
              ykiho={group.ykiho}
              name={group.hospitalName}
              itemCode={itemCode}
            />
          </div>
        </div>
      )}
    </article>
  );
}

/** 평균과 이만큼(%) 안쪽으로 차이 나면 "평균 수준"으로 쓴다. 몇 % 차이는 싼 편인지 판단하는 데 도움이 되지 않는다. */
const SAME_WITHIN_PERCENT = 5;

const TAG_STYLE = {
  below: { icon: ArrowDown, tone: 'bg-positive-tint text-positive' },
  above: { icon: ArrowUp, tone: 'bg-warning-tint text-warning' },
  same: { icon: Equal, tone: 'bg-surface-strong text-text-secondary' },
} as const satisfies Record<AverageComparison['direction'], unknown>;

/** 같은 조건 평균과의 차이. 색만으로 알리지 않게 화살표·같음 아이콘과 문장을 함께 쓴다. */
function AverageTag({ comparison }: { comparison: AverageComparison }) {
  const t = useTranslations('items.card.comparison');
  const { icon: Icon, tone } = TAG_STYLE[comparison.direction];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md py-0.5 pr-2 pl-1.5 text-label-bold tabular-nums',
        tone,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
      {comparison.direction === 'same'
        ? t('same')
        : t(comparison.direction, { percent: comparison.percent })}
    </span>
  );
}

function VariantDate({ startDate }: { startDate: string | null }) {
  const t = useTranslations('items.card');
  const format = useFormatter();
  return (
    <span className="text-caption text-text-tertiary">
      {startDate
        ? t('startDate', {
            date: format.dateTime(new Date(startDate), 'date'),
          })
        : t('startDateUnknown')}
    </span>
  );
}

function VariantRow({ variant }: { variant: HospitalPrice }) {
  const tPrice = useTranslations('common.price');
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2.5">
      <span className="min-w-0 text-body-sm text-text-primary">
        {variant.itemName}
      </span>
      <span className="text-label-bold tabular-nums">
        {tPrice('won', { amount: variant.price })}
      </span>
      <span className="basis-full">
        <VariantDate startDate={variant.startDate} />
      </span>
    </div>
  );
}
