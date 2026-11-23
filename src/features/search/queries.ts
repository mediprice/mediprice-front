import {
  type InfiniteData,
  infiniteQueryOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import { npayQueries } from '@/features/npay/queries';
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

import { type ItemListPage, searchApi } from './api';

/** 이전 백엔드는 페이지마다 항목별 가격 요약을 따로 받으므로 작게 나눈다. */
const ITEM_PAGE_SIZE = 10;
/** 가격 있는 항목이 나올 때까지 화면이 저절로 더 읽는 페이지 수(useFillPriced). 미리 읽기도 이 수를 넘지 않는다. */
export const MAX_AUTO_PAGES = 6;
const HOSPITAL_PAGE_SIZE = 20;

type Schemas = components['schemas'];
type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
};

/** 여러 조건(분류 코드·시도)을 하나의 목록처럼 이어 붙일 때 지금 읽는 조건과 그 조건의 페이지. */
type StreamCursor = { stream: number; page: number };

/** 다음 페이지 커서는 이 값으로 돌아오지 않으므로 첫 페이지 표시로 쓴다. */
const FIRST_PAGE: StreamCursor = { stream: 0, page: 0 };

type MergedPage<T> = {
  content: T[];
  cursor: StreamCursor;
  totalPages: number;
  /** 조건별 전체 개수. 첫 페이지에만 있다. */
  totals: number[];
  /** 조건별 첫 페이지에 가격 있는 항목이 있는지. 목록이 요약을 함께 줄 때 첫 페이지에만 있다. */
  priced?: boolean[];
  /** 백엔드가 요약을 함께 주고 가격 있는 항목을 먼저 준 페이지다(#24). 이전 백엔드면 false다. */
  pricedFirst?: boolean;
};

type ListedItem = ItemListPage['content'][number];

export type ItemSearchParams = {
  keyword?: string;
  /** 비어 있으면 분류 조건 없이 검색한다. 백엔드는 코드 하나만 받으므로 여러 개는 차례로 조회한다. */
  categoryCodes?: readonly string[];
  /** 가격 요약을 낼 지역(시도 코드). 비어 있으면 전국이다. */
  sidoCodes: readonly string[];
};

/** hasPrice는 그 지역에 공개 가격이 있는지다. 요약 조회가 실패하면 null(모름)이다. */
export type ItemResult = Schemas['NpayItemResponse'] & {
  hasPrice: boolean | null;
};

export type HospitalSearchParams = {
  keyword: string;
  sidoCodes: readonly string[];
};

export const searchKeys = {
  all: ['search'] as const,
  items: (params: ItemSearchParams) =>
    [...searchKeys.all, 'items', params] as const,
  hospitals: (params: HospitalSearchParams) =>
    [...searchKeys.all, 'hospitals', params] as const,
};

type FetchStreamPage<T> = (
  stream: number,
  page: number,
) => Promise<PageResponse<T>>;

/** 첫 페이지는 모든 조건의 첫 페이지를 함께 받아 전체 개수를 알고, 결과가 있는 첫 조건부터 보여 준다. */
async function fetchMergedPage<T>(
  fetchPage: FetchStreamPage<T>,
  streamCount: number,
  cursor: StreamCursor,
  isPriced?: (item: T) => boolean | null,
): Promise<MergedPage<T>> {
  if (cursor.stream !== FIRST_PAGE.stream || cursor.page !== FIRST_PAGE.page) {
    const response = await fetchPage(cursor.stream, cursor.page);
    return { ...pick(response), cursor, totals: [] };
  }
  const responses = await Promise.all(
    Array.from({ length: streamCount }, (_, stream) => fetchPage(stream, 0)),
  );
  const found = responses.findIndex((response) => response.content.length > 0);
  const stream = found === -1 ? 0 : found;
  const response = responses[stream];
  if (!response) throw new Error('fetchMergedPage needs at least one stream');
  return {
    ...pick(response),
    cursor: { stream, page: 0 },
    totals: responses.map(({ totalElements }) => totalElements),
    ...(isPriced && {
      priced: responses.map((r) => r.content.some((item) => isPriced(item))),
    }),
  };
}

function pick<T>({ content, totalPages }: PageResponse<T>) {
  return { content, totalPages };
}

function nextCursor<T>(
  lastPage: MergedPage<T>,
  allPages: MergedPage<T>[],
): StreamCursor | undefined {
  const { stream, page } = lastPage.cursor;
  if (page + 1 < lastPage.totalPages) return { stream, page: page + 1 };
  const totals = allPages[0]?.totals ?? [];
  const next = totals.findIndex((total, index) => index > stream && total > 0);
  return next === -1 ? undefined : { stream: next, page: 0 };
}

/** 이어 붙인 목록 전체 개수. 첫 페이지가 아직 없으면 undefined다. */
export function totalCount(pages: readonly { totals: number[] }[]) {
  return pages[0]?.totals.reduce((sum, total) => sum + total, 0);
}

/** 목록이 요약을 함께 줬으면 그 값, 아니면(이전 백엔드) null이다. */
function listedPriced(item: ListedItem) {
  return item.priceSummary ? item.priceSummary.avgPrice != null : null;
}

/** 목록 한 페이지(요약 전). 이어 읽기에서 미리 받은 페이지를 다음 페이지 조회가 다시 쓰도록 캐시에 둔다. */
function itemListPage(params: ItemSearchParams, cursor: StreamCursor) {
  return queryOptions({
    queryKey: [...searchKeys.items(params), 'list', cursor] as const,
    /** 미리 받은 페이지를 이어 읽기가 다시 받지 않게 한다. 목록 전체의 다시 읽기 주기(기본 1분)와 같다. */
    staleTime: 60 * 1000,
    queryFn: async (): Promise<MergedPage<ListedItem>> => {
      const page = await fetchMergedPage<ListedItem>(
        (stream, pageIndex) =>
          searchApi.fetchItems({
            keyword: params.keyword,
            categoryCode: params.categoryCodes?.[stream],
            sidoCodes: params.sidoCodes,
            page: pageIndex,
            size: ITEM_PAGE_SIZE,
          }),
        Math.max(1, params.categoryCodes?.length ?? 0),
        cursor,
        listedPriced,
      );
      const pricedFirst =
        page.content.length > 0 &&
        page.content.every((item) => item.priceSummary != null);
      return pricedFirst
        ? { ...page, pricedFirst }
        : { ...page, pricedFirst, priced: undefined };
    },
  });
}

/**
 * 가격 있는 항목을 아직 못 찾았을 때 더 읽어서 찾을 수 있는지. 목록이 가격 있는 항목을 먼저 주면(#24) 지금 분류에는 더 없으므로
 * 뒤 분류의 첫 페이지에 가격이 있을 때만 그렇다. 이전 백엔드면 알 수 없으므로 늘 그렇다고 본다.
 */
export function mayFindMorePriced(
  pages: readonly Pick<
    MergedPage<unknown>,
    'cursor' | 'priced' | 'pricedFirst'
  >[],
) {
  if (!pages.every((page) => page.pricedFirst)) return true;
  const last = pages.at(-1);
  if (!last) return false;
  return (pages[0]?.priced ?? []).some(
    (hasPriced, stream) => stream > last.cursor.stream && hasPriced,
  );
}

/** 가격 유무를 붙인다. 목록에 요약이 있으면 상세 화면과 같은 키로 캐시에 넣고, 없으면(이전 백엔드) 항목마다 함께 요청한다. */
async function withPrices(
  client: QueryClient,
  params: ItemSearchParams,
  page: MergedPage<ListedItem>,
): Promise<MergedPage<ItemResult>> {
  const content = await Promise.all(
    page.content.map(({ priceSummary, ...item }) => {
      const summary = npayQueries.summaryIn(item.code, params.sidoCodes);
      if (priceSummary) {
        client.setQueryData(summary.queryKey, priceSummary);
        return { ...item, hasPrice: priceSummary.avgPrice != null };
      }
      return client.ensureQueryData(summary).then(
        (loaded) => ({ ...item, hasPrice: loaded.avgPrice != null }),
        () => ({ ...item, hasPrice: null }),
      );
    }),
  );
  return { ...page, content };
}

/**
 * 앞 페이지에 가격 있는 항목이 없으면 화면이 다음 페이지를 저절로 읽으므로(useFillPriced),
 * 다음 페이지 목록과 요약을 지금 페이지 요약과 함께 미리 받아 페이지마다 두 번 기다리던 왕복을 한 번으로 줄인다.
 */
function prefetchFollowing(
  client: QueryClient,
  params: ItemSearchParams,
  page: MergedPage<ListedItem>,
) {
  const previous =
    client.getQueryData<InfiniteData<MergedPage<ItemResult>>>(
      searchKeys.items(params),
    )?.pages ?? [];
  if (previous.length === 0 || previous.length + 1 >= MAX_AUTO_PAGES) return;
  if (previous.some((p) => p.content.some((item) => item.hasPrice === true)))
    return;
  if (!mayFindMorePriced([...previous, page])) return;
  const next = nextCursor(page, [...previous, page]);
  if (!next) return;
  void client
    .fetchQuery(itemListPage(params, next))
    .then((listed) => withPrices(client, params, listed))
    .catch(() => undefined);
}

export const searchQueries = {
  /** 페이지마다 항목별 가격 요약을 캐시에 채워 두고 가격 유무를 붙인다. 화면이 가격 없는 항목을 따로 모아도 행이 나중에 움직이지 않는다. */
  items: (params: ItemSearchParams) =>
    infiniteQueryOptions({
      queryKey: searchKeys.items(params),
      queryFn: async ({ pageParam, client }) => {
        const listed = await client.fetchQuery(itemListPage(params, pageParam));
        prefetchFollowing(client, params, listed);
        return withPrices(client, params, listed);
      },
      initialPageParam: FIRST_PAGE,
      getNextPageParam: nextCursor,
    }),

  hospitals: (params: HospitalSearchParams) =>
    infiniteQueryOptions({
      queryKey: searchKeys.hospitals(params),
      queryFn: ({ pageParam }) =>
        fetchMergedPage<Schemas['HospitalSummaryResponse']>(
          (stream, page) =>
            unwrap(
              apiClient.GET('/api/hospitals', {
                params: {
                  query: {
                    condition: {
                      keyword: params.keyword,
                      sidoCode: params.sidoCodes[stream],
                    },
                    pageQuery: { page, size: HOSPITAL_PAGE_SIZE },
                  },
                },
              }),
            ),
          Math.max(1, params.sidoCodes.length),
          pageParam,
        ),
      initialPageParam: FIRST_PAGE,
      getNextPageParam: nextCursor,
    }),
};
