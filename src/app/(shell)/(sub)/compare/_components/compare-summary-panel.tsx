'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import type { ComparisonBasis } from '@/features/comparison/compare-basis';
import { stripDomain, stripMarkers } from '@/features/comparison/compare-strip';
import { CompareNumber } from '@/features/comparison/components/compare-number';
import { CompareStrip } from '@/features/comparison/components/compare-strip';
import type {
  ComparisonHospital,
  ComparisonItem,
} from '@/features/comparison/queries';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';

/**
 * 머리의 요약 카드: 결론 문장, 서울·경기 범위 막대 위에 찍은 병원 번호 점, 결론과 같은 기준(같은 세부 항목 또는 가장 낮은 공개 가격)의 병원별 가격 목록.
 * 가격마다 어느 세부 항목인지 이름을 붙인다. 막대는 장식이고 같은 내용을 목록이 글자로 전한다.
 */
export function CompareSummaryPanel({
  row,
  basis,
  hospitals,
  sentence,
  basisNote,
  gap,
}: {
  row: ComparisonItem;
  basis: ComparisonBasis;
  hospitals: readonly ComparisonHospital[];
  sentence: string;
  basisNote: ReactNode;
  gap: ReactNode;
}) {
  const t = useTranslations('comparison.page');
  const tPrice = useTranslations('common.price');
  const tRegion = useTranslations('common.region');
  const region = tRegion(DEFAULT_REGION);
  const regional = useQuery(
    npayQueries.summaryIn(row.npayCode, sidoCodesOf(DEFAULT_REGION)),
  );
  const markers = stripMarkers(basis, hospitals);
  const range = regional.data
    ? { min: regional.data.minPrice, max: regional.data.maxPrice }
    : null;
  const domain = stripDomain(
    markers.map((marker) => marker.value),
    range,
  );
  const average = regional.data?.avgPrice ?? null;

  return (
    <section className="mt-2.5 flex flex-col gap-5 rounded-xl bg-bg p-4 shadow-card lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading text-balance">{sentence}</h2>
        {basisNote && (
          <p className="text-body-sm text-text-secondary">{basisNote}</p>
        )}
        {gap && <p className="text-body-sm text-text-secondary">{gap}</p>}
      </div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
        {regional.isPending ? (
          <Skeleton className="h-24 w-full lg:flex-1" />
        ) : (
          domain && (
            <div className="flex min-w-0 flex-col gap-2 lg:flex-1">
              <CompareStrip
                domain={domain}
                markers={markers}
                average={average}
                averageLabel={
                  average != null
                    ? t('regionAverage', { region, amount: average })
                    : undefined
                }
              />
              <p className="text-body-sm text-text-tertiary">
                {regional.data && range?.min != null
                  ? t('regionNote', {
                      region,
                      count: regional.data.hospitalCount,
                    })
                  : t('hospitalsNote')}
              </p>
            </div>
          )
        )}
        <ul
          aria-label={
            basis.kind === 'sameVariant'
              ? t('legendLabelSame')
              : t('legendLabel')
          }
          className="flex min-w-0 flex-col divide-y divide-hairline border-y border-hairline lg:flex-1"
        >
          {hospitals.map((hospital, index) => {
            const marker = markers.find((m) => m.id === hospital.ykiho);
            const value = marker?.value;
            const isLowest = marker?.isLowest ?? false;
            const variant = basis.entries.find(
              (entry) => entry.ykiho === hospital.ykiho,
            )?.variant;
            return (
              <li
                key={hospital.ykiho}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
              >
                <CompareNumber value={index + 1} isLowest={isLowest} />
                <span className="flex min-w-0 flex-1 basis-32 flex-col gap-0.5">
                  <span className="text-body text-text-primary">
                    {hospital.name}
                  </span>
                  {variant && value != null && (
                    <span className="text-body-sm text-text-secondary">
                      {t('variantBasis', { name: variant })}
                    </span>
                  )}
                </span>
                <span className="ml-auto flex shrink-0 flex-col items-end gap-0.5 text-right lg:flex-row-reverse lg:items-center lg:gap-3">
                  {value == null ? (
                    <span className="text-body-sm text-text-tertiary">
                      {tPrice('none')}
                    </span>
                  ) : (
                    <span className="text-price-md">
                      {tPrice('won', { amount: value })}
                    </span>
                  )}
                  {isLowest && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-positive-tint py-0.5 pr-2 pl-1.5 text-caption-bold text-positive">
                      <ArrowDown
                        aria-hidden="true"
                        className="size-3"
                        strokeWidth={2}
                      />
                      {t('lowestTag')}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
