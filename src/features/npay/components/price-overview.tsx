'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { PriceSummary } from '../price-summary';
import { PriceSpread } from './price-spread';

/**
 * 목록 행·카드의 가격 요약. 극단값에 끌려가는 최저~최고 대신 평균을 크게 쓰고, 범위는 막대가 아니라 읽히는 글자로,
 * 병원 수와 함께 작게 쓴다(docs 14장). 값 점이 없는 범위 막대는 정보가 없어 쓰지 않는다.
 */
export function PriceOverview({
  summary,
  className,
}: {
  summary: PriceSummary;
  className?: string;
}) {
  const t = useTranslations('common.price');
  const average = summary.avgPrice;
  if (average == null) {
    return (
      <p className={cn('text-body-sm text-text-tertiary', className)}>
        {t('none')}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="text-price-lg">
        {t.rich('averageParts', {
          amount: average,
          nb: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
        })}
      </p>
      <PriceSpread min={summary.minPrice} max={summary.maxPrice} />
      <p className="text-body-sm text-text-tertiary tabular-nums">
        {t('hospitals', { count: summary.hospitalCount })}
      </p>
    </div>
  );
}
