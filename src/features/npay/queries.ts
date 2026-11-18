import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

const ONE_HOUR = 60 * 60 * 1000;
const PRICE_PAGE_SIZE = 20;

export type NpayItemSearchParams = NonNullable<
  paths['/api/npay-items']['get']['parameters']['query']
>;
export type NpayPriceParams = NonNullable<
  paths['/api/npay-items/{npayCode}/prices']['get']['parameters']['query']
>;
export type NpayPriceCondition = NonNullable<
  paths['/api/npay-items/{npayCode}/price-summary']['get']['parameters']['query']
>['condition'];
export type NpayPriceListParams = Omit<NpayPriceParams, 'pageQuery'>;

export const npayKeys = {
  all: ['npay'] as const,
  categories: () => [...npayKeys.all, 'categories'] as const,
  lists: () => [...npayKeys.all, 'list'] as const,
  list: (params: NpayItemSearchParams) =>
    [...npayKeys.lists(), params] as const,
  detail: (code: string) => [...npayKeys.all, 'detail', code] as const,
  summary: (code: string, condition: NpayPriceCondition) =>
    [...npayKeys.detail(code), 'summary', condition] as const,
  prices: (code: string, params: NpayPriceParams) =>
    [...npayKeys.detail(code), 'prices', params] as const,
  priceList: (code: string, params: NpayPriceListParams) =>
    [...npayKeys.detail(code), 'priceList', params] as const,
};

export const npayQueries = {
  categories: () =>
    queryOptions({
      queryKey: npayKeys.categories(),
      queryFn: () => unwrap(apiClient.GET('/api/npay-items/categories')),
      staleTime: ONE_HOUR,
    }),

  search: (params: NpayItemSearchParams) =>
    queryOptions({
      queryKey: npayKeys.list(params),
      queryFn: () =>
        unwrap(apiClient.GET('/api/npay-items', { params: { query: params } })),
    }),

  detail: (code: string) =>
    queryOptions({
      queryKey: npayKeys.detail(code),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/npay-items/{npayCode}', {
            params: { path: { npayCode: code } },
          }),
        ),
      staleTime: ONE_HOUR,
    }),

  summary: (code: string, condition: NpayPriceCondition = {}) =>
    queryOptions({
      queryKey: npayKeys.summary(code, condition),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/npay-items/{npayCode}/price-summary', {
            params: { path: { npayCode: code }, query: { condition } },
          }),
        ),
    }),

  prices: (code: string, params: NpayPriceParams) =>
    queryOptions({
      queryKey: npayKeys.prices(code, params),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/npay-items/{npayCode}/prices', {
            params: { path: { npayCode: code }, query: params },
          }),
        ),
    }),

  /** 항목별 가격 목록의 "더 보기". 마지막 페이지에서는 다음 페이지가 없다. */
  priceList: (code: string, params: NpayPriceListParams) =>
    infiniteQueryOptions({
      queryKey: npayKeys.priceList(code, params),
      queryFn: ({ pageParam }) =>
        unwrap(
          apiClient.GET('/api/npay-items/{npayCode}/prices', {
            params: {
              path: { npayCode: code },
              query: {
                ...params,
                pageQuery: { page: pageParam, size: PRICE_PAGE_SIZE },
              },
            },
          }),
        ),
      initialPageParam: 0,
      getNextPageParam: (lastPage) =>
        lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
    }),
};
