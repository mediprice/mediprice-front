'use client';

import { ChevronDown } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { PriceRange } from '@/components/ui/price-range';
import { RangeBar } from '@/components/ui/range-bar';
import { CompareToggle } from '@/features/comparison/components/compare-toggle';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { HospitalIdentity } from '@/features/hospitals/components/hospital-identity';
import { formatLocation } from '@/features/regions/format-location';
import { cn } from '@/lib/utils';

import type { HospitalPriceGroup } from '../group-prices';
import type { HospitalPrice } from '../price-stream';
import type { PriceSummary } from '../price-summary';

/**
 * 항목별 가격 목록의 병원 한 행. 병원이 같은 항목을 이름별로 따로 신고하므로 최저~최고가를 오른쪽에 크게 쓰고,
 * 세부 이름·가격은 펼쳐서 본다. 행 전체는 병원 이름 링크가 덮고, 펼치기·관심·비교함 버튼만 그 위(relative z-10)에 올린다.
 * 목록이 행 사이 구분선(divide-y divide-hairline)을 준다.
 */
export function HospitalPriceGroupCard<T extends string>({
  group,
  href,
  summary,
}: {
  group: HospitalPriceGroup;
  href: Route<T>;
  /** 같은 조건의 항목 요약. 있으면 이 병원 최저가가 범위 어디쯤인지 작은 막대로 보여 준다. */
  summary?: Pick<PriceSummary, 'minPrice' | 'maxPrice' | 'avgPrice'>;
}) {
  const t = useTranslations('items.card');
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

  return (
    <article className="relative flex flex-col gap-3 px-4 pt-5 pb-4 transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface md:px-6 md:pt-6 md:pb-5">
      <div className="flex items-start justify-between gap-4 md:gap-6">
        <HospitalIdentity
          as="h3"
          className="min-w-0 flex-1"
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
        <div className="flex max-w-1/2 shrink-0 flex-col items-end gap-2 text-right">
          <PriceRange
            min={group.minPrice}
            max={group.maxPrice}
            className="text-price-lg"
          />
          {summary && (
            <RangeBar
              size="sm"
              min={summary.minPrice}
              max={summary.maxPrice}
              average={summary.avgPrice}
              value={group.minPrice}
              className="w-24 md:w-36"
            />
          )}
        </div>
      </div>

      {firstVariant && (
        <div className="flex flex-col gap-2">
          {isExpanded ? (
            <ul
              id={listId}
              aria-label={t('variantsLabel', { hospital: group.hospitalName })}
              className="flex flex-col divide-y divide-hairline rounded-lg bg-surface px-3"
            >
              {group.variants.map((variant, index) => (
                <li key={index}>
                  <VariantRow variant={variant} />
                </li>
              ))}
            </ul>
          ) : (
            <div
              id={listId}
              className="flex flex-wrap items-center gap-x-2 gap-y-1"
            >
              <VariantName name={firstVariant.itemName} />
              {extraCount > 0 ? (
                <span className="text-body-sm text-text-tertiary">
                  {t('moreVariants', { count: extraCount })}
                </span>
              ) : (
                <VariantDate startDate={firstVariant.startDate} />
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {extraCount > 0 && (
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
            )}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
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
        </div>
      )}
    </article>
  );
}

function VariantName({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <span className="rounded-md bg-surface px-2 py-0.5 text-body-sm text-text-secondary">
      {name}
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
