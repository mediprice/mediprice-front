import { BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { rowStrip } from '@/features/comparison/compare-strip';
import { CompareStrip } from '@/features/comparison/components/compare-strip';
import type {
  ComparisonHospital,
  ComparisonItem,
} from '@/features/comparison/queries';
import { cn } from '@/lib/utils';

/** 모바일에서 옆으로 밀어도 남는 첫 열. */
export const LABEL_CELL =
  'sticky left-0 z-10 border-r border-hairline bg-surface px-2.5 py-3 align-top text-left text-caption-strong text-text-secondary lg:px-6 lg:py-4 lg:text-label';

/** 막대 줄이 붙는가. 데스크톱 빈 칸의 rowSpan을 맞출 때 쓴다. */
export const hasStripRow = (
  row: ComparisonItem,
  hospitals: readonly ComparisonHospital[],
) => rowStrip(row, hospitals) !== null;

/**
 * 항목 하나의 병원별 가격. 한 병원 안의 세부 가격은 최저~최고로 보여 주고, 가장 낮은 곳에 아이콘과 "최저"를 단다.
 * 값이 서로 다르면 아래 줄에 병원 번호 점을 찍은 작은 막대를 둔다(장식, 같은 내용은 위 칸의 글자).
 */
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
  const strip = rowStrip(row, hospitals);
  const lowest = new Set(
    strip?.markers
      .filter((marker) => marker.isLowest)
      .map((marker) => marker.id),
  );
  const tint = isEmphasized && 'bg-primary-tint';

  return (
    <>
      <tr className={cn(!strip && 'border-b border-hairline', tint)}>
        <th
          scope="row"
          rowSpan={strip ? 2 : 1}
          className={cn(LABEL_CELL, strip && 'border-b')}
        >
          {label}
          {sublabel && (
            <span className="mt-0.5 block text-caption text-text-tertiary">
              {sublabel}
            </span>
          )}
        </th>
        {hospitals.map((hospital) => {
          const cell = row.prices.find(
            (price) => price.ykiho === hospital.ykiho,
          );
          const isLowest = lowest.has(hospital.ykiho);
          return (
            <td
              key={hospital.ykiho}
              className={cn(
                'px-2.5 pt-3 align-top lg:px-6',
                strip ? 'pb-1' : 'pb-3',
                isEmphasized ? 'lg:pt-5' : 'lg:pt-3.5',
                !strip && (isEmphasized ? 'lg:pb-5' : 'lg:pb-3.5'),
              )}
            >
              <div className="flex flex-col items-start gap-1">
                <CellPrice
                  min={cell?.minPrice}
                  max={cell?.maxPrice}
                  className={cn(
                    isEmphasized
                      ? 'text-label-bold lg:text-price-md xl:text-price-lg'
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-positive-tint py-0.5 pr-2 pl-1.5 text-caption-bold text-positive">
                    <BadgeCheck
                      aria-hidden="true"
                      className="size-3.5"
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
      {strip && (
        <tr aria-hidden="true" className={cn('border-b border-hairline', tint)}>
          <td
            colSpan={hospitals.length}
            className={cn(
              'px-2.5 pt-1 pb-3 lg:px-6',
              isEmphasized ? 'lg:pb-5' : 'lg:pb-4',
            )}
          >
            <CompareStrip
              size="sm"
              domain={strip.domain}
              markers={strip.markers}
            />
          </td>
          {trailing}
        </tr>
      )}
    </>
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
