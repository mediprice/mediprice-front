'use client';

import { useQuery } from '@tanstack/react-query';

import { comparableBand } from '@/features/npay/average-verdict';
import {
  type PriceFilters,
  toPriceConditions,
} from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';
import { useRegionalSummary } from '@/features/npay/use-regional-summary';

import { useItemReady } from './use-item-ready';

/**
 * 목록이 기본으로 보여 주는 "평균과 견줄 수 있는 가격"(평균의 1/3~3배) 범위의 요약. 요약 카드와 목록이 같은 조회를 써서
 * 같은 병원 수·최저~최고를 말하게 한다. 모든 가격 보기거나 평균이 없으면 범위가 없다(band null).
 */
export function useComparableSummary(code: string, filters: PriceFilters) {
  const isReady = useItemReady(code);
  const summary = useRegionalSummary(code, filters, { enabled: isReady });
  const band =
    filters.prices === 'all' ? null : comparableBand(summary.data?.avgPrice);
  const conditions = toPriceConditions(filters, band);
  const bandSummary = useQuery({
    ...npayQueries.summaryOf(code, conditions),
    enabled: isReady && band !== null,
  });
  return { summary, band, conditions, bandSummary };
}
