'use client';

import { ChevronDown } from 'lucide-react';
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

import type { HospitalPriceGroup } from '../group-prices';
import type { HospitalPrice, PriceSortOrder } from '../price-stream';
import type { PriceSummary } from '../price-summary';
import { representativeVariant } from '../representative-price';
import { AverageTag } from './average-tag';

/**
 * 항목별 가격 목록의 병원 한 곳. 대표 세부 항목(정렬 기준 쪽 끝)의 가격을 크게 쓰고 그 이름("도수치료F 기준")을 바로 아래에 둬서,
 * 꼬리표·막대·가격이 모두 같은 세부 항목을 말하게 한다. 링크도 그 세부 항목을 병원 화면에 넘긴다(hrefFor).
 * 카드 전체는 병원 이름 링크가 덮고, 펼치기·관심·비교함 버튼과 펼친 목록만 그 위(relative z-10)에 올린다.
 */
export function HospitalPriceGroupCard<T extends string>({
  group,
  hrefFor,
  summary,
  sort = 'price_asc',
  showAverageTick = false,
}: {
  group: HospitalPriceGroup;
  /** 행이 보여 준 세부 항목을 병원 화면이 먼저 고르도록 그 행을 받아 링크를 만든다. */
  hrefFor: (variant: HospitalPrice) => Route<T>;
  /** 같은 조건의 항목 요약. 있으면 평균 대비 꼬리표와 범위 막대를 보여 준다. */
  summary?: Pick<PriceSummary, 'minPrice' | 'maxPrice' | 'avgPrice'>;
  /** 목록 정렬. 대표 세부 항목을 정렬 기준과 같은 쪽 끝으로 고른다. */
  sort?: PriceSortOrder;
  /** 막대의 평균 눈금에 "평균" 라벨을 붙인다. 목록의 첫 카드에서만 켠다. */
  showAverageTick?: boolean;
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
  const representative = representativeVariant(group.variants, sort);
  if (!representative) return null;
  const { variant, other } = representative;
  const hasVariants = group.variants.length > 1;

  return (
    <article className="relative flex flex-col gap-3 rounded-xl pressable bg-bg px-4 pt-4 pb-3.5 shadow-card md:px-6 md:py-5">
      {/** md부터 이름 옆에 가격을 두되, 큰 글자로 이름 칸이 9rem보다 좁아지면 가격이 이름 아래 줄로 내려간다. */}
      <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-start md:gap-x-6">
        <HospitalIdentity
          as="h3"
          className="md:min-w-[min(100%,9rem)] md:flex-1"
          nameClassName="wrap-break-word"
          meta={meta}
          name={
            <Link
              href={hrefFor(variant)}
              className="rounded-sm after:absolute after:inset-0 after:rounded-xl hover:text-primary-text"
            >
              {group.hospitalName}
            </Link>
          }
        />
        <p className="flex max-w-full flex-col md:ml-auto md:items-end md:text-right">
          <span className="text-price-lg">
            {tPrice('won', { amount: variant.price })}
          </span>
          {variant.itemName && (
            <span className="max-w-60 text-body-sm text-balance text-text-secondary">
              {t('basis', { name: variant.itemName })}
            </span>
          )}
          {other && (
            <span className="text-body-sm text-text-tertiary tabular-nums">
              {other.kind === 'maximum'
                ? tPrice('maximum', { amount: other.price })
                : tPrice('minimum', { amount: other.price })}
            </span>
          )}
        </p>
      </div>

      {summary?.avgPrice != null && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <AverageTag price={variant.price} average={summary.avgPrice} />
          <div aria-hidden="true" className="w-28 md:w-40">
            <RangeBar
              size="sm"
              min={summary.minPrice}
              max={summary.maxPrice}
              average={summary.avgPrice}
              value={variant.price}
              showAverageTick={showAverageTick}
            />
          </div>
        </div>
      )}

      {hasVariants && (
        <ul
          id={listId}
          hidden={!isExpanded}
          aria-label={t('variantsLabel', { hospital: group.hospitalName })}
          className="relative z-10 flex flex-col divide-y divide-hairline rounded-lg bg-surface px-3"
        >
          {group.variants.map((row, index) => (
            <li key={index}>
              <VariantRow variant={row} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {hasVariants ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={listId}
            onClick={() => setIsExpanded((value) => !value)}
            className="relative z-10 -my-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-md text-label text-primary-text hover:underline"
          >
            {isExpanded
              ? t('hideVariants')
              : t('showVariants', { count: group.variants.length })}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-4 transition-transform duration-150 ease-standard',
                isExpanded && 'rotate-180',
              )}
              strokeWidth={1.75}
            />
          </button>
        ) : (
          <VariantDate startDate={variant.startDate} />
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
    </article>
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
