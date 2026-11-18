'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
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
 * 머리의 결론 아래 묶음: 서울·경기 범위 막대 위에 찍은 병원 번호 점과 병원별 최저가 목록.
 * 큰 숫자는 두지 않는다. 가장 낮은 세부 가격은 "1일당" 같은 예외 값일 수 있어 대표값으로 내세우지 않는다(평균 우선).
 * 막대는 장식이고 같은 내용을 목록이 글자로 전한다.
 */
export function CompareSummaryPanel({
  row,
  hospitals,
}: {
  row: ComparisonItem;
  hospitals: readonly ComparisonHospital[];
}) {
  const t = useTranslations('comparison.page');
  const tPrice = useTranslations('common.price');
  const tRegion = useTranslations('common.region');
  const region = tRegion(DEFAULT_REGION);
  const regional = useQuery(
    npayQueries.summaryIn(row.npayCode, sidoCodesOf(DEFAULT_REGION)),
  );
  const markers = stripMarkers(row, hospitals);
  const range = regional.data
    ? { min: regional.data.minPrice, max: regional.data.maxPrice }
    : null;
  const domain = stripDomain(
    markers.map((marker) => marker.value),
    range,
  );
  const average = regional.data?.avgPrice ?? null;

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-surface p-4 md:p-6 lg:flex-row lg:items-start lg:gap-10 lg:p-8">
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
        aria-label={t('legendLabel')}
        className="flex min-w-0 flex-col divide-y divide-hairline rounded-2xl bg-bg px-4 lg:flex-1"
      >
        {hospitals.map((hospital, index) => {
          const marker = markers.find((m) => m.id === hospital.ykiho);
          const value = marker?.value;
          const isLowest = marker?.isLowest ?? false;
          return (
            <li
              key={hospital.ykiho}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
            >
              <CompareNumber value={index + 1} isLowest={isLowest} />
              <span className="min-w-0 flex-1 basis-32 text-body text-text-primary">
                {hospital.name}
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
                  <span className="inline-flex items-center gap-1 text-label-bold text-positive">
                    <BadgeCheck
                      aria-hidden="true"
                      className="size-4.5"
                      strokeWidth={1.75}
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
  );
}
