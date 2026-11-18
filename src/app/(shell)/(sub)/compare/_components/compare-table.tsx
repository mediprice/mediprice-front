'use client';

import { ChevronRight, Plus, X } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { type CSSProperties, type ReactNode, type Ref, useId } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import type {
  ComparisonHospital,
  ComparisonItem,
} from '@/features/comparison/queries';
import { toTelHref } from '@/features/hospitals/detail-links';
import { formatLocation } from '@/features/regions/format-location';

import { CommonItemRows } from './common-item-rows';
import { LABEL_CELL, PriceRow } from './price-row';

/**
 * 병원 비교표. 데스크톱은 190px 이름 열 + 같은 폭의 병원 열 3개(빈 칸은 "병원 추가"),
 * 모바일은 이름 열을 붙여 둔 채 옆으로 밀어 보는 표다. 행끼리 비교하는 것이 목적이라 카드로 쪼개지 않는다.
 */
export function CompareTable<T extends string>({
  hospitals,
  slots,
  addHref,
  item,
  itemRow,
  itemName,
  dates,
  commonItems,
  commonTotal,
  onRemove,
  regionRef,
  regionId,
  headingId,
}: {
  hospitals: readonly ComparisonHospital[];
  slots: number;
  addHref: Route<T>;
  item: string | null;
  itemRow: ComparisonItem | null;
  itemName: string | null;
  /** 병원 순서대로의 적용일. undefined는 불러오는 중이다. */
  dates: readonly (string | null | undefined)[];
  /** 함께 공개한 다른 항목 중 지금 보여 줄 것. null이면 아직 없다. */
  commonItems: readonly ComparisonItem[] | null;
  commonTotal: number;
  onRemove: (ykiho: string) => void;
  regionRef: Ref<HTMLDivElement>;
  regionId: string;
  /** 표 위 SectionHeader의 제목. 스크롤 영역의 이름이 된다. */
  headingId: string;
}) {
  const t = useTranslations('comparison.table');
  const tPage = useTranslations('comparison.page');
  const format = useFormatter();
  const captionId = useId();
  const columnCount = 1 + hospitals.length + slots;
  const infoRows = 3 + (itemRow ? 2 : 0);
  const detailQuery = item ? `?item=${item}` : '';

  return (
    <div className="flex flex-col gap-2">
      {hospitals.length >= 2 && (
        <p className="text-caption text-text-tertiary md:hidden">
          {t('scrollHint')}
        </p>
      )}
      <div
        ref={regionRef}
        id={regionId}
        role="region"
        aria-labelledby={headingId}
        tabIndex={0}
        className="overflow-x-auto overscroll-x-contain rounded-xl border border-hairline bg-bg outline-offset-2"
      >
        <table
          style={{ '--cols': hospitals.length } as CSSProperties}
          className="w-full min-w-[calc(5rem+var(--cols)*9.5rem)] table-fixed border-collapse text-left lg:min-w-0"
        >
          <caption id={captionId} className="sr-only">
            {itemName ? t('caption', { item: itemName }) : t('captionNoItem')}
          </caption>
          <colgroup>
            <col className="w-20 md:w-32 lg:w-47.5" />
            {hospitals.map((hospital) => (
              <col key={hospital.ykiho} />
            ))}
            {Array.from({ length: slots }, (_, index) => (
              <col key={index} className="w-0 lg:w-auto" />
            ))}
          </colgroup>
          <tbody>
            <tr className="border-b border-hairline">
              <td className={LABEL_CELL}>{t('hospital')}</td>
              {hospitals.map((hospital) => (
                <th
                  key={hospital.ykiho}
                  scope="col"
                  className="p-3 align-top lg:px-6 lg:py-5"
                >
                  <div className="flex items-start gap-1">
                    <span className="min-w-0 flex-1 pt-0.5 text-label-bold text-text-primary lg:text-heading">
                      {hospital.name}
                    </span>
                    <button
                      type="button"
                      aria-label={t('remove', { name: hospital.name })}
                      onClick={() => onRemove(hospital.ykiho)}
                      className="touch-target -mt-1 -mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface active:bg-surface-strong"
                    >
                      <X
                        aria-hidden="true"
                        className="size-4.5"
                        strokeWidth={1.75}
                      />
                    </button>
                  </div>
                  {hospital.className && (
                    <p className="mt-0.5 text-caption text-text-tertiary">
                      {hospital.className}
                    </p>
                  )}
                  <Link
                    href={`/hospitals/${encodeURIComponent(hospital.ykiho)}${detailQuery}`}
                    className="-mb-2 inline-flex min-h-11 items-center gap-0.5 text-label text-primary-text hover:underline"
                  >
                    {t('detail')}
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={2}
                    />
                  </Link>
                </th>
              ))}
              {Array.from({ length: slots }, (_, index) => (
                <td
                  key={index}
                  rowSpan={1 + infoRows}
                  className="relative hidden lg:table-cell"
                >
                  <Link
                    href={addHref}
                    className="absolute inset-4 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-primary-tint text-label-bold text-primary-text hover:bg-primary-tint-hover active:bg-primary-tint-pressed"
                  >
                    <Plus
                      aria-hidden="true"
                      className="size-5"
                      strokeWidth={2}
                    />
                    {tPage('addHospital')}
                  </Link>
                </td>
              ))}
            </tr>

            {itemRow && (
              <>
                <PriceRow
                  hospitals={hospitals}
                  row={itemRow}
                  label={t('price')}
                  sublabel={itemName}
                  isEmphasized
                />
                <InfoRow label={t('startDate')} hospitals={hospitals}>
                  {(_, index) => {
                    const date = dates[index];
                    if (date === undefined)
                      return <Skeleton className="h-5 w-24" />;
                    return date ? (
                      <span className="whitespace-nowrap tabular-nums">
                        {format.dateTime(new Date(date), 'dateShort')}
                      </span>
                    ) : (
                      <>
                        <span aria-hidden="true" className="text-text-tertiary">
                          {t('dateNone')}
                        </span>
                        <span className="sr-only">{t('startDateUnknown')}</span>
                      </>
                    );
                  }}
                </InfoRow>
              </>
            )}

            <InfoRow label={t('region')} hospitals={hospitals}>
              {(hospital) =>
                formatLocation(hospital.sidoName, hospital.sgguName) || <None />
              }
            </InfoRow>
            <InfoRow label={t('address')} hospitals={hospitals}>
              {(hospital) => hospital.address || <None />}
            </InfoRow>
            <InfoRow label={t('phone')} hospitals={hospitals}>
              {(hospital) => {
                const tel = toTelHref(hospital.phone);
                return tel && hospital.phone ? (
                  <a
                    href={tel}
                    className="-my-3 inline-flex min-h-11 items-center whitespace-nowrap text-primary-text tabular-nums underline-offset-4 hover:underline"
                  >
                    {hospital.phone}
                  </a>
                ) : (
                  <None />
                );
              }}
            </InfoRow>
          </tbody>

          {commonItems && (
            <CommonItemRows
              hospitals={hospitals}
              items={commonItems}
              total={commonTotal}
              columnCount={columnCount}
              slots={slots}
            />
          )}
        </table>
      </div>
    </div>
  );
}

function None() {
  const t = useTranslations('comparison.table');
  return <span className="text-text-tertiary">{t('none')}</span>;
}

function InfoRow({
  label,
  hospitals,
  children,
}: {
  label: string;
  hospitals: readonly ComparisonHospital[];
  children: (hospital: ComparisonHospital, index: number) => ReactNode;
}) {
  return (
    <tr className="border-b border-hairline">
      <th scope="row" className={LABEL_CELL}>
        {label}
      </th>
      {hospitals.map((hospital, index) => (
        <td
          key={hospital.ykiho}
          className="p-3 align-top text-body-sm text-text-primary lg:px-6 lg:py-4 lg:text-body"
        >
          {children(hospital, index)}
        </td>
      ))}
    </tr>
  );
}
