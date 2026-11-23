import { useTranslations } from 'next-intl';

import type { PriceSummary } from '@/features/npay/price-summary';
import { cn } from '@/lib/utils';

import { PriceSpread } from './price-spread';

/**
 * 극단값에 끌려가는 최저~최고 대신 평균을 크게, 세부 항목별 최저~최고(글자)와 병원 수를 작게 보여 준다(docs 14장).
 * 값 점이 없는 범위 막대는 정보가 없어 쓰지 않는다.
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
    <div className={cn('space-y-0.5', className)}>
      <p className="text-price-md tabular-nums">
        {t.rich('averageParts', {
          amount: average,
          nb: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
        })}
      </p>
      <PriceSpread
        min={summary.minPrice}
        max={summary.maxPrice}
        className="text-caption text-text-tertiary"
      />
      <p className="text-caption text-text-tertiary tabular-nums">
        {t('hospitals', { count: summary.hospitalCount })}
      </p>
    </div>
  );
}
