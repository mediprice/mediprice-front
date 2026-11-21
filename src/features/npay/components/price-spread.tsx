import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/**
 * "최저 1,000원 ~ 최고 500,000원 (세부 항목별 가격)". 값 점이 없는 범위 막대 대신 읽히는 글자로 쓴다(docs 14장).
 * 최저·최고는 세부 항목 하나의 가격이라 단위가 다를 수 있어 그 뜻을 함께 쓴다. 범위가 없으면 그리지 않는다.
 */
export function PriceSpread({
  min,
  max,
  className,
}: {
  min: number | null | undefined;
  max: number | null | undefined;
  className?: string;
}) {
  const t = useTranslations('common.price');
  if (min == null || max == null || max <= min) return null;
  return (
    <p
      className={cn('text-body-sm text-text-secondary tabular-nums', className)}
    >
      {t.rich('spreadParts', {
        min,
        max,
        nb: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
        note: (chunks) => (
          <span className="whitespace-nowrap text-text-tertiary">{chunks}</span>
        ),
      })}
    </p>
  );
}
