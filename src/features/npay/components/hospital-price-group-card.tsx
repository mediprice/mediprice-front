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
 * 항목별 가격 목록의 병원 한 행. 대표 세부 항목(정렬 기준 쪽 끝)의 가격을 크게 쓰고 그 이름("도수치료F 기준")을 바로 아래에 둬서,
 * 꼬리표·막대·가격이 모두 같은 세부 항목을 말하게 한다. 링크도 그 세부 항목을 병원 화면에 넘긴다(hrefFor).
 * 모바일은 이름·가격 / 꼬리표·막대 / 버튼 세 줄, lg는 이름 | 꼬리표·막대 | 가격 | 버튼 한 줄이다.
 * 행 전체는 병원 이름 링크가 덮고, 펼치기·관심·비교함 버튼만 그 위(relative z-10)에 올린다. 목록이 구분선(divide-y divide-hairline)을 준다.
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
  /** 막대의 평균 눈금에 "평균" 라벨을 붙인다. 목록의 첫 행에서만 켠다. */
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
    <article className="relative grid grid-cols-1 gap-3 px-4 pt-5 pb-3 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface md:px-6 md:pt-6 md:pb-4 lg:grid-cols-[minmax(10rem,1fr)_14rem_minmax(9rem,auto)_auto] lg:items-center lg:gap-x-6 lg:gap-y-2 lg:py-5">
      {/** 큰 글자로 이름 칸이 9rem보다 좁아지면 가격이 이름 아래 줄로 내려간다. lg에서는 풀어서 격자 칸으로 쓴다. */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1 md:gap-x-8 lg:contents">
        <div className="flex min-w-[min(100%,9rem)] flex-1 flex-col gap-1 lg:col-start-1 lg:row-start-1">
          <HospitalIdentity
            as="h3"
            nameClassName="wrap-break-word"
            meta={meta}
            name={
              <Link
                href={hrefFor(variant)}
                className="rounded-sm after:absolute after:inset-0 hover:text-primary-text"
              >
                {group.hospitalName}
              </Link>
            }
          />
          {hasVariants && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={listId}
              onClick={() => setIsExpanded((value) => !value)}
              className="relative z-10 -my-1 hidden min-h-11 w-fit items-center gap-1 rounded-md text-label text-primary-text hover:underline lg:inline-flex"
            >
              <ExpandLabel
                isExpanded={isExpanded}
                count={group.variants.length}
              />
            </button>
          )}
          {!hasVariants && (
            <span className="hidden lg:block">
              <VariantDate startDate={variant.startDate} />
            </span>
          )}
        </div>
        <p className="ml-auto flex max-w-full flex-col items-end text-right lg:col-start-3 lg:row-start-1 lg:ml-0">
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
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:justify-end lg:col-start-2 lg:row-start-1 lg:flex-col lg:items-start lg:justify-center">
          <AverageTag price={variant.price} average={summary.avgPrice} />
          <div aria-hidden="true" className="w-28 md:w-40 lg:w-full">
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

      <div className="flex flex-wrap items-center gap-x-3 lg:col-start-4 lg:row-start-1">
        {hasVariants ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={listId}
            onClick={() => setIsExpanded((value) => !value)}
            className="relative z-10 inline-flex min-h-11 w-fit items-center gap-1 rounded-md text-label text-primary-text hover:underline lg:hidden"
          >
            <ExpandLabel
              isExpanded={isExpanded}
              count={group.variants.length}
            />
          </button>
        ) : (
          <span className="py-1 lg:hidden">
            <VariantDate startDate={variant.startDate} />
          </span>
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

      {hasVariants && (
        <ul
          id={listId}
          hidden={!isExpanded}
          aria-label={t('variantsLabel', { hospital: group.hospitalName })}
          className="relative z-10 mb-1 flex flex-col divide-y divide-hairline rounded-xl border border-border bg-bg px-3 lg:col-span-full"
        >
          {group.variants.map((row, index) => (
            <li key={index}>
              <VariantRow variant={row} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ExpandLabel({
  isExpanded,
  count,
}: {
  isExpanded: boolean;
  count: number;
}) {
  const t = useTranslations('items.card');
  return (
    <>
      {isExpanded ? t('hideVariants') : t('showVariants', { count })}
      <ChevronDown
        aria-hidden="true"
        className={cn(
          'size-4 transition-transform duration-200 ease-standard',
          isExpanded && 'rotate-180',
        )}
        strokeWidth={1.75}
      />
    </>
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
