import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { PriceSummary } from '../price-summary';

/** 극단값에 끌려가는 최저~최고 대신 평균을 크게, 범위와 병원 수를 작게 보여 준다. */
export function PriceOverview({
  summary,
  className,
}: {
  summary: PriceSummary;
  className?: string;
}) {
  const t = useTranslations('common.price');
  if (summary.avgPrice == null) {
    return (
      <p className={cn('text-body-sm text-text-tertiary', className)}>
        {t('none')}
      </p>
    );
  }
  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="text-price-md tabular-nums">
        {t('average', { amount: summary.avgPrice })}
      </p>
      <p className="flex flex-wrap gap-x-1.5 text-caption text-text-tertiary tabular-nums [&>span]:whitespace-nowrap">
        {summary.minPrice != null && summary.maxPrice != null && (
          <span>
            {t('minMax', { min: summary.minPrice, max: summary.maxPrice })}
          </span>
        )}
        <span>{t('hospitals', { count: summary.hospitalCount })}</span>
      </p>
    </div>
  );
}
