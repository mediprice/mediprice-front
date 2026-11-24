'use client';

import { useQuery } from '@tanstack/react-query';

import { sidoCodesOf } from '@/features/regions/service-region';

import { type PriceFilters, toPriceConditions } from './price-filters';
import { npayQueries } from './queries';

/** 지역만 고르면 홈·검색과 캐시를 함께 쓰는 summaryIn을, 시군구·종별이 있으면 조건별 요약(summaryOf)을 쓴다. */
export function useRegionalSummary(
  code: string,
  filters: PriceFilters,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const hasExtra = Boolean(filters.sggu || filters.institution);
  const byConditions = useQuery({
    ...npayQueries.summaryOf(code, toPriceConditions(filters)),
    enabled: enabled && hasExtra,
  });
  const byRegion = useQuery({
    ...npayQueries.summaryIn(code, sidoCodesOf(filters.region)),
    enabled: enabled && !hasExtra,
  });
  return hasExtra ? byConditions : byRegion;
}
