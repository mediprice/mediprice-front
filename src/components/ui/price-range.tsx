import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** "30,000~250,000원". 둘 다 없으면 "가격 정보 없음", 같으면 한 값만 쓴다. 금액 사이에서만 줄바꿈된다. */
export function PriceRange({
  min,
  max,
  className,
}: {
  min: number | null | undefined;
  max: number | null | undefined;
  className?: string;
}) {
  const t = useTranslations('common.price');
  const low = min ?? max;
  const high = max ?? min;

  if (low == null || high == null) {
    return (
      <span className={cn('text-text-tertiary', className)}>{t('none')}</span>
    );
  }
  return (
    <span className={cn('tabular-nums', className)}>
      {low === high
        ? t('won', { amount: low })
        : t.rich('rangeParts', {
            min: low,
            max: high,
            amount: (chunks) => (
              <span className="whitespace-nowrap">{chunks}</span>
            ),
          })}
    </span>
  );
}
