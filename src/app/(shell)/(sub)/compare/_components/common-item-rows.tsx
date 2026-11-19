'use client';

import { useTranslations } from 'next-intl';

import {
  formatComparisonItemName,
  groupComparisonItems,
} from '@/features/comparison/compare-rows';
import type {
  ComparisonHospital,
  ComparisonItem,
} from '@/features/comparison/queries';

import { PriceRow } from './price-row';

/** 병원들이 함께 공개한 다른 항목. 분류마다 tbody 하나로 묶고 분류 이름을 그 묶음의 머리글로 둔다. */
export function CommonItemRows({
  hospitals,
  items,
  total,
  columnCount,
  slots,
}: {
  hospitals: readonly ComparisonHospital[];
  /** 지금 펼쳐 보여 줄 항목. */
  items: readonly ComparisonItem[];
  total: number;
  columnCount: number;
  slots: number;
}) {
  const t = useTranslations('comparison.common');
  const groups = groupComparisonItems(items);
  const slotCells = Array.from({ length: slots }, (_, index) => (
    <td key={index} className="hidden lg:table-cell" />
  ));

  return (
    <>
      <tbody>
        <tr className="border-b border-hairline bg-bg">
          <th scope="colgroup" colSpan={columnCount} className="p-0">
            <span className="sticky left-0 inline-flex items-baseline gap-1.5 px-3 pt-5 pb-2.5 text-label-bold text-text-primary lg:px-6">
              {t('title')}
              <span className="text-caption text-text-tertiary tabular-nums">
                {t('count', { count: total })}
              </span>
            </span>
          </th>
        </tr>
        {items.length === 0 && (
          <tr>
            <td
              colSpan={columnCount}
              className="px-3 py-4 text-body-sm text-text-secondary lg:px-6"
            >
              {t('empty')}
            </td>
          </tr>
        )}
      </tbody>
      {groups.map((group) => (
        <tbody key={group.category ?? ''}>
          <tr className="border-b border-hairline bg-surface">
            <th scope="rowgroup" colSpan={columnCount} className="p-0">
              <span className="sticky left-0 inline-block px-3 py-2 text-caption-strong text-text-secondary lg:px-6">
                {group.category ?? t('other')}
              </span>
            </th>
          </tr>
          {group.items.map((item) => (
            <PriceRow
              key={item.npayCode}
              hospitals={hospitals}
              row={item}
              label={formatComparisonItemName(item)}
              trailing={slotCells}
            />
          ))}
        </tbody>
      ))}
    </>
  );
}
