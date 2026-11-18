import { ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { findLowest } from '@/features/comparison/compare-rows';
import type {
  ComparisonHospital,
  ComparisonItem,
} from '@/features/comparison/queries';
import { cn } from '@/lib/utils';

/** 모바일에서 옆으로 밀어도 남는 첫 열. */
export const LABEL_CELL =
  'sticky left-0 z-10 border-r border-hairline bg-surface px-2.5 py-3 align-top text-left text-caption-strong text-text-secondary lg:px-6 lg:py-4 lg:text-label';

/** 항목 하나의 병원별 가격. 한 병원 안의 세부 가격은 최저~최고로 보여 주고, 가장 낮은 곳에 "최저" 표시를 단다. */
export function PriceRow({
  hospitals,
  row,
  label,
  sublabel,
  isEmphasized = false,
  trailing,
}: {
  hospitals: readonly ComparisonHospital[];
  row: ComparisonItem;
  label: string;
  sublabel?: string | null;
  isEmphasized?: boolean;
  /** 데스크톱의 빈 칸(병원 추가) 열을 채우는 셀. */
  trailing?: ReactNode;
}) {
  const t = useTranslations('comparison.table');
  const lowest = findLowest(
    row.prices.filter((price) =>
      hospitals.some((hospital) => hospital.ykiho === price.ykiho),
    ),
  );

  return (
    <tr
      className={cn(
        'border-b border-hairline',
        isEmphasized && 'bg-linear-to-b from-primary-tint to-bg',
      )}
    >
      <th scope="row" className={LABEL_CELL}>
        {label}
        {sublabel && (
          <span className="mt-0.5 block text-caption text-text-tertiary">
            {sublabel}
          </span>
        )}
      </th>
      {hospitals.map((hospital) => {
        const cell = row.prices.find((price) => price.ykiho === hospital.ykiho);
        const isLowest = lowest.has(hospital.ykiho);
        return (
          <td
            key={hospital.ykiho}
            className={cn(
              'px-2.5 py-3 align-top lg:px-6',
              isEmphasized ? 'lg:py-5' : 'lg:py-3.5',
            )}
          >
            <div className="flex flex-col items-start gap-1">
              <CellPrice
                min={cell?.minPrice}
                max={cell?.maxPrice}
                className={cn(
                  isEmphasized
                    ? 'text-label-bold lg:text-price-lg'
                    : 'text-label lg:text-label-bold',
                  cell?.minPrice != null && 'text-text-primary',
                )}
              />
              {cell && cell.priceCount > 1 && (
                <span className="text-caption text-text-tertiary">
                  {t('variants', { count: cell.priceCount })}
                </span>
              )}
              {isLowest && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-positive-tint py-0.5 pr-2 pl-1.5 text-caption-bold text-positive">
                  <ArrowDown
                    aria-hidden="true"
                    className="size-3"
                    strokeWidth={2}
                  />
                  {t('lowest')}
                </span>
              )}
            </div>
          </td>
        );
      })}
      {trailing}
    </tr>
  );
}

/** 좁은 열(모바일 144px)에서 금액은 한 줄로 두고, 넘칠 때만 "~" 뒤에서 줄을 바꾼다. */
function CellPrice({
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
  /** 줄을 바꿔야 하면 "5,000~" 다음에서 바꾼다. */
  let isMaxNext = false;
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
            amount: (chunks) => {
              const isMax = isMaxNext;
              isMaxNext = true;
              return (
                <>
                  {isMax && <wbr />}
                  <span className="whitespace-nowrap">{chunks}</span>
                </>
              );
            },
          })}
    </span>
  );
}
