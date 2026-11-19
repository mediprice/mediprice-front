'use client';

import { useQuery } from '@tanstack/react-query';

import {
  type PriceFilters,
  toPriceConditions,
} from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';
import { sidoCodesOf } from '@/features/regions/service-region';

import { useItemReady } from './use-item-ready';

/** 지역만 고르면 홈·검색과 캐시를 나누는 summaryIn을, 시군구·종별이 있으면 조건별 요약을 합친다. */
export function usePriceSummary(code: string, filters: PriceFilters) {
  const isReady = useItemReady(code);
  const hasExtra = Boolean(filters.sggu || filters.institution);
  const byConditions = useQuery({
    ...npayQueries.summaryOf(code, toPriceConditions(filters)),
    enabled: isReady && hasExtra,
  });
  const byRegion = useQuery({
    ...npayQueries.summaryIn(code, sidoCodesOf(filters.region)),
    enabled: isReady && !hasExtra,
  });
  return hasExtra ? byConditions : byRegion;
}
