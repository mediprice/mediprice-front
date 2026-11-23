import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { type ApiClient, apiClient } from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

import type { PriceBand } from './average-verdict';
import {
  createPriceCursor,
  type PriceSortOrder,
  pullMergedPrices,
} from './price-stream';
import { mergeSummaries } from './price-summary';

const ONE_HOUR = 60 * 60 * 1000;
const PRICE_FETCH_SIZE = 30;
const NEW_HOSPITALS_PER_PAGE = 10;
const MAX_ROWS_PER_PAGE = 150;

export type NpayItemSearchParams = NonNullable<
  paths['/api/npay-items']['get']['parameters']['query']
>;
export type NpayPriceParams = NonNullable<
  paths['/api/npay-items/{npayCode}/prices']['get']['parameters']['query']
>;
export type NpayPriceCondition = NonNullable<
  paths['/api/npay-items/{npayCode}/price-summary']['get']['parameters']['query']
>['condition'] &
  Partial<PriceBand>;
/** 여러 조건(시도별)을 가격순으로 합쳐 한 목록으로 본다. */
export type NpayPriceListParams = {
  conditions: NpayPriceCondition[];
  sort: PriceSortOrder;
};

export const npayKeys = {
  all: ['npay'] as const,
  categories: () => [...npayKeys.all, 'categories'] as const,
  lists: () => [...npayKeys.all, 'list'] as const,
  list: (params: NpayItemSearchParams) =>
    [...npayKeys.lists(), params] as const,
  detail: (code: string) => [...npayKeys.all, 'detail', code] as const,
  summary: (code: string, condition: NpayPriceCondition) =>
    [...npayKeys.detail(code), 'summary', condition] as const,
  summaryIn: (code: string, sidoCodes: readonly string[]) =>
    [...npayKeys.detail(code), 'summaryIn', sidoCodes] as const,
  summaryOf: (code: string, conditions: readonly NpayPriceCondition[]) =>
    [...npayKeys.detail(code), 'summaryOf', conditions] as const,
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

  detail: (code: string, client: ApiClient = apiClient) =>
    queryOptions({
      queryKey: npayKeys.detail(code),
      queryFn: () =>
        unwrap(
          client.GET('/api/npay-items/{npayCode}', {
            params: { path: { npayCode: code } },
          }),
        ),
      staleTime: ONE_HOUR,
    }),

  /** 서울·경기처럼 여러 시도의 요약을 각각 받아 합친다. 빈 배열이면 전국 요약 하나다. */
  summaryIn: (
    code: string,
    sidoCodes: readonly string[],
    client: ApiClient = apiClient,
  ) =>
    queryOptions({
      queryKey: npayKeys.summaryIn(code, sidoCodes),
      queryFn: async () => {
        const conditions = sidoCodes.length
          ? sidoCodes.map((sidoCode) => ({ sidoCode }))
          : [{}];
        const summaries = await Promise.all(
          conditions.map((condition) =>
            unwrap(
              client.GET('/api/npay-items/{npayCode}/price-summary', {
                params: { path: { npayCode: code }, query: { condition } },
              }),
            ),
          ),
        );
        return mergeSummaries(code, summaries);
      },
    }),

  /** 시도별 조건에 시군구·종별이 더해진 경우. 조건마다 요약을 받아 합친다. */
  summaryOf: (
    code: string,
    conditions: readonly NpayPriceCondition[],
    client: ApiClient = apiClient,
  ) =>
    queryOptions({
      queryKey: npayKeys.summaryOf(code, conditions),
      queryFn: async () =>
        mergeSummaries(
          code,
          await Promise.all(
            conditions.map((condition) =>
              unwrap(
                client.GET('/api/npay-items/{npayCode}/price-summary', {
                  params: { path: { npayCode: code }, query: { condition } },
                }),
              ),
            ),
          ),
        ),
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

  /** 항목별 가격 목록의 "더 보기". 조건별 목록을 가격순으로 합치고, 한 번에 새 병원이 10곳 이상 나오게 읽는다. */
  priceList: (
    code: string,
    { conditions, sort }: NpayPriceListParams,
    client: ApiClient = apiClient,
  ) =>
    infiniteQueryOptions({
      queryKey: npayKeys.priceList(code, { conditions, sort }),
      queryFn: ({ pageParam }) =>
        pullMergedPrices({
          cursor: pageParam,
          sort,
          minNewHospitals: NEW_HOSPITALS_PER_PAGE,
          maxRows: MAX_ROWS_PER_PAGE,
          fetchPage: (condition, page) =>
            unwrap(
              client.GET('/api/npay-items/{npayCode}/prices', {
                params: {
                  path: { npayCode: code },
                  query: {
                    condition,
                    sortCondition: { sort },
                    pageQuery: { page, size: PRICE_FETCH_SIZE },
                  },
                },
              }),
            ),
        }),
      initialPageParam: createPriceCursor(
        conditions.length > 0 ? conditions : [{}],
      ),
      getNextPageParam: (lastPage) => lastPage.next,
    }),
};
