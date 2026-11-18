'use client';

import { useQuery } from '@tanstack/react-query';

import {
  pickSeries,
  summarizePriceTrend,
} from '@/features/hospitals/price-history';
import { hospitalQueries } from '@/features/hospitals/queries';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';

/** 선택한 비급여 항목의 이름과, 이 병원이 그 항목으로 공개한 세부 가격들. */
export function useItemPrices(ykiho: string, item: string | null) {
  const detail = useQuery({
    ...npayQueries.detail(item ?? ''),
    enabled: item != null,
  });
  const name = detail.data?.name;
  const prices = useQuery({
    ...hospitalQueries.itemPrices(ykiho, item ?? '', name ?? ''),
    enabled: item != null && name != null,
  });

  return {
    displayName:
      detail.data?.detailName ?? detail.data?.sdivName ?? detail.data?.name,
    rows: prices.data,
    isPending: detail.isPending || prices.isPending,
    /** 항목 이름(경로·제목에 쓰임)을 아직 모른다. 항목이 없으면 false다. */
    isNamePending: item != null && detail.isPending,
    error: detail.error ?? prices.error,
    refetch: () => (detail.isError ? detail.refetch() : prices.refetch()),
  };
}

export type ItemPrices = ReturnType<typeof useItemPrices>;

/** 선택한 세부 항목의 월별 가격 추이. 세부 항목 이름으로 시리즈를 고른다. */
export function usePriceTrend(
  ykiho: string,
  item: string | null,
  variant: string | null,
) {
  const history = useQuery({
    ...hospitalQueries.priceHistory(ykiho, { npayCode: item ?? '' }),
    enabled: item != null,
  });
  const series = history.data
    ? pickSeries(history.data.series, variant)
    : undefined;

  return {
    isPending: history.isPending,
    error: history.error,
    refetch: () => history.refetch(),
    series,
    summary: summarizePriceTrend(series?.points ?? []),
  };
}

export type PriceTrendState = ReturnType<typeof usePriceTrend>;

/** 선택 항목의 기본 지역(서울·경기) 요약. 이 병원 가격이 평균보다 싼지 막대와 문장으로 보여 줄 때 쓴다. */
export function useRegionSummary(item: string | null) {
  return useQuery({
    ...npayQueries.summaryIn(item ?? '', sidoCodesOf(DEFAULT_REGION)),
    enabled: item != null,
  });
}

export type RegionSummaryState = ReturnType<typeof useRegionSummary>;
