import type { components } from '@/lib/api/schema';

export type PriceSummary = components['schemas']['PriceSummaryResponse'];

/** 시도별 요약을 합친다. 병원·가격 수는 시도끼리 겹치지 않으므로 더하고, 평균은 가격 수로 가중한다. */
export function mergeSummaries(
  npayCode: string,
  summaries: PriceSummary[],
): PriceSummary {
  const priced = summaries.filter((summary) => summary.priceCount > 0);
  const priceCount = priced.reduce((sum, s) => sum + s.priceCount, 0);
  const minOf = (values: (number | null)[]) => {
    const present = values.filter((value): value is number => value != null);
    return present.length ? Math.min(...present) : null;
  };
  const maxOf = (values: (number | null)[]) => {
    const present = values.filter((value): value is number => value != null);
    return present.length ? Math.max(...present) : null;
  };

  return {
    npayCode,
    minPrice: minOf(priced.map((s) => s.minPrice)),
    maxPrice: maxOf(priced.map((s) => s.maxPrice)),
    avgPrice: priceCount
      ? Math.round(
          priced.reduce((sum, s) => sum + (s.avgPrice ?? 0) * s.priceCount, 0) /
            priceCount,
        )
      : null,
    priceCount,
    hospitalCount: summaries.reduce((sum, s) => sum + s.hospitalCount, 0),
  };
}
