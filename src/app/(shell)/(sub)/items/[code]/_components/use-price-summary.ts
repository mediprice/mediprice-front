'use client';

import { useQuery } from '@tanstack/react-query';

import { comparableBand } from '@/features/npay/average-verdict';
import {
  type PriceFilters,
  toPriceConditions,
} from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';
import { sidoCodesOf } from '@/features/regions/service-region';

import { useItemReady } from './use-item-ready';

/** 지역만 고르면 홈·검색과 캐시를 나누는 summaryIn을, 시군구·종별이 있으면 조건별 요약을 합친다. */
function usePriceSummary(code: string, filters: PriceFilters) {
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

/**
 * 목록이 기본으로 보여 주는 "평균과 견줄 수 있는 가격"(평균의 1/3~3배) 범위의 요약. 요약 카드와 목록이 같은 조회를 써서
 * 같은 병원 수·최저~최고를 말하게 한다. 모든 가격 보기거나 평균이 없으면 범위가 없다(band null).
 */
export function useComparableSummary(code: string, filters: PriceFilters) {
  const isReady = useItemReady(code);
  const summary = usePriceSummary(code, filters);
  const band =
    filters.prices === 'all' ? null : comparableBand(summary.data?.avgPrice);
  const conditions = toPriceConditions(filters, band);
  const bandSummary = useQuery({
    ...npayQueries.summaryOf(code, conditions),
    enabled: isReady && band !== null,
  });
  return { summary, band, conditions, bandSummary };
}
