'use client';

import { useQuery } from '@tanstack/react-query';

import { hospitalQueries } from '@/features/hospitals/queries';
import { npayQueries } from '@/features/npay/queries';

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

  const displayName =
    detail.data?.detailName ?? detail.data?.sdivName ?? detail.data?.name;
  const error = detail.error ?? prices.error;

  return {
    displayName,
    rows: prices.data,
    isPending: detail.isPending || prices.isPending,
    error,
    refetch: () => {
      if (detail.isError) void detail.refetch();
      else void prices.refetch();
    },
  };
}

export function variantName(row: {
  hospitalItemName: string | null;
  itemName: string;
}) {
  return row.hospitalItemName?.trim() || row.itemName;
}
