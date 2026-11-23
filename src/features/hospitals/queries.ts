import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { type ApiClient, apiClient } from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

export type HospitalPriceCondition = NonNullable<
  paths['/api/hospitals/{ykiho}/prices']['get']['parameters']['query']
>['condition'];
export type PriceHistoryCondition = NonNullable<
  paths['/api/hospitals/{ykiho}/prices/history']['get']['parameters']['query']
>['condition'];

/** 백엔드가 한 페이지에 허용하는 최대 크기다. */
const MAX_PAGE_SIZE = 100;
const PRICE_PAGE_SIZE = 20;

export const hospitalKeys = {
  all: ['hospitals'] as const,
  details: () => [...hospitalKeys.all, 'detail'] as const,
  detail: (ykiho: string) => [...hospitalKeys.details(), ykiho] as const,
  priceList: (ykiho: string, condition: HospitalPriceCondition) =>
    [...hospitalKeys.detail(ykiho), 'prices', condition] as const,
  itemPrices: (ykiho: string, npayCode: string, itemName: string) =>
    [...hospitalKeys.detail(ykiho), 'item-prices', npayCode, itemName] as const,
  priceHistory: (ykiho: string, condition: PriceHistoryCondition) =>
    [...hospitalKeys.detail(ykiho), 'history', condition] as const,
};

function fetchPrices(
  client: ApiClient,
  ykiho: string,
  condition: HospitalPriceCondition,
  page: number,
  size: number,
) {
  return unwrap(
    client.GET('/api/hospitals/{ykiho}/prices', {
      params: {
        path: { ykiho },
        query: { condition, pageQuery: { page, size } },
      },
    }),
  );
}

export const hospitalQueries = {
  detail: (ykiho: string, client: ApiClient = apiClient) =>
    queryOptions({
      queryKey: hospitalKeys.detail(ykiho),
      queryFn: () =>
        unwrap(
          client.GET('/api/hospitals/{ykiho}', {
            params: { path: { ykiho } },
          }),
        ),
    }),

  priceList: (
    ykiho: string,
    condition: HospitalPriceCondition,
    client: ApiClient = apiClient,
  ) =>
    infiniteQueryOptions({
      queryKey: hospitalKeys.priceList(ykiho, condition),
      queryFn: ({ pageParam }) =>
        fetchPrices(client, ykiho, condition, pageParam, PRICE_PAGE_SIZE),
      initialPageParam: 0,
      getNextPageParam: (last) =>
        last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    }),

  /** 가격 API에 코드 필터가 없어 항목 이름으로 좁힌 뒤 코드가 같은 세부 항목만 남긴다. */
  itemPrices: (
    ykiho: string,
    npayCode: string,
    itemName: string,
    client: ApiClient = apiClient,
  ) =>
    queryOptions({
      queryKey: hospitalKeys.itemPrices(ykiho, npayCode, itemName),
      queryFn: async () => {
        const page = await fetchPrices(
          client,
          ykiho,
          { keyword: itemName },
          0,
          MAX_PAGE_SIZE,
        );
        return page.content.filter((row) => row.npayCode === npayCode);
      },
    }),

  priceHistory: (
    ykiho: string,
    condition: PriceHistoryCondition,
    client: ApiClient = apiClient,
  ) =>
    queryOptions({
      queryKey: hospitalKeys.priceHistory(ykiho, condition),
      queryFn: () =>
        unwrap(
          client.GET('/api/hospitals/{ykiho}/prices/history', {
            params: { path: { ykiho }, query: { condition } },
          }),
        ),
    }),
};
