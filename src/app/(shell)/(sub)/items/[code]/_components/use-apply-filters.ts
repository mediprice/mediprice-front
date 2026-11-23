'use client';

import { useRouter } from 'next/navigation';

import {
  buildPriceFiltersQuery,
  type PriceFilters,
} from '@/features/npay/price-filters';

export const RESULTS_HEADING_ID = 'item-prices-title';

/** 필터는 URL에 둔다(공유 가능). 기록을 쌓지 않고 스크롤 위치를 유지한다. */
export function useApplyFilters(code: string) {
  const router = useRouter();
  return (filters: PriceFilters, options?: { focusResults?: boolean }) => {
    const query = buildPriceFiltersQuery(filters);
    const path = `/items/${encodeURIComponent(code)}` as const;
    router.replace(query ? `${path}?${query}` : path, { scroll: false });
    /** 누른 칩·버튼이 사라지므로 포커스를 결과 제목으로 옮긴다. */
    if (options?.focusResults) {
      document.getElementById(RESULTS_HEADING_ID)?.focus();
    }
  };
}
