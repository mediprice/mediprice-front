'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { RangeBar } from '@/components/ui/range-bar';
import { RollingNumber } from '@/components/ui/rolling-number';
import { cn } from '@/lib/utils';

import type { PriceSummary } from '../price-summary';

/**
 * 극단값에 끌려가는 최저~최고 대신 평균을 크게, 범위 막대와 병원 수를 작게 보여 준다(docs 14장).
 * md는 목록 행·카드용(평균 + 작은 막대 + 최저·최고·병원 수), lg는 화면 머리용(굴러 올라가는 큰 평균 + 라벨 붙은 막대).
 */
export function PriceOverview({
  summary,
  size = 'md',
  label,
  isRolling = size === 'lg',
  className,
}: {
  summary: PriceSummary;
  size?: 'md' | 'lg';
  /** lg에서 큰 숫자 위의 한 줄("서울·경기 평균"). 없으면 "평균"이다. */
  label?: ReactNode;
  isRolling?: boolean;
  className?: string;
}) {
  const t = useTranslations('common.price');
  const tBar = useTranslations('common.rangeBar');
  const average = summary.avgPrice;
  if (average == null) {
    return (
      <p className={cn('text-body-sm text-text-tertiary', className)}>
        {t('none')}
      </p>
    );
  }
  const amount = isRolling ? (
    <RollingNumber
      value={average}
      format={(value) => t('won', { amount: value })}
    />
  ) : (
    t('won', { amount: average })
  );

  if (size === 'lg') {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <div>
          <p className="text-label text-text-secondary">
            {label ?? tBar('average')}
          </p>
          <p className="text-price-hero">{amount}</p>
        </div>
        <RangeBar
          min={summary.minPrice}
          max={summary.maxPrice}
          average={average}
          showAverageAmount={false}
          className="max-w-xl"
        />
        <p className="text-body-sm text-text-tertiary">
          {t('hospitals', { count: summary.hospitalCount })}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="text-price-lg">
        {t.rich('averageParts', {
          amount: average,
          nb: () => <span className="whitespace-nowrap">{amount}</span>,
        })}
      </p>
      <RangeBar
        size="sm"
        min={summary.minPrice}
        max={summary.maxPrice}
        average={average}
        className="w-full max-w-60"
      />
      <p className="flex flex-wrap gap-x-2 text-caption text-text-tertiary tabular-nums [&>span]:whitespace-nowrap">
        {summary.minPrice != null && (
          <span>{t('minimum', { amount: summary.minPrice })}</span>
        )}
        {summary.maxPrice != null && (
          <span>{t('maximum', { amount: summary.maxPrice })}</span>
        )}
        <span>{t('hospitals', { count: summary.hospitalCount })}</span>
      </p>
    </div>
  );
}
