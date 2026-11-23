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

/** 모든 조건의 첫 페이지를 함께 읽는 첫 페이지 표시. 실제 조건 번호가 아니라서 조건 순서를 바꿔 {stream: 0, page: 0}을 나중에 읽어도 겹치지 않는다. */
const FIRST_PAGE: StreamCursor = { stream: -1, page: 0 };

type MergedPage<T> = {
  content: T[];
  cursor: StreamCursor;
  totalPages: number;
  /** 조건별 전체 개수. 첫 페이지에만 있다. */
  totals: number[];
  /** 조건별 첫 페이지에 가격 있는 항목이 있는지. 모든 조건의 첫 페이지가 요약을 함께 줬을 때 첫 페이지에만 있다. */
  priced?: boolean[];
  /** 조건을 읽는 순서. priced가 있으면 가격 있는 조건을 먼저 읽는다. 첫 페이지에만 있다. */
  order?: number[];
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
  const priced = pricedStreamsOf(responses, isPriced);
  const order = streamOrder(streamCount, priced);
  const stream =
    order.find((index) => (responses[index]?.content.length ?? 0) > 0) ?? 0;
  const response = responses[stream];
  if (!response) throw new Error('fetchMergedPage needs at least one stream');
  return {
    ...pick(response),
    cursor: { stream, page: 0 },
    totals: responses.map(({ totalElements }) => totalElements),
    ...(priced && { priced, order }),
  };
}

/** 모든 조건의 첫 페이지 항목마다 가격 유무를 알 때만(목록이 요약을 함께 줌) 조건별로 가격 있는 항목이 있는지 돌려준다. */
function pricedStreamsOf<T>(
  responses: readonly PageResponse<T>[],
  isPriced?: (item: T) => boolean | null,
) {
  if (!isPriced) return undefined;
  const heads = responses.map((response) => response.content.map(isPriced));
  if (heads.some((head) => head.some((value) => value === null)))
    return undefined;
  return heads.map((head) => head.some(Boolean));
}

/**
 * 가격 있는 항목을 먼저 주는 응답이면 조건 안에서는 가격 없는 항목이 뒤에 있으므로, 가격 있는 조건을 먼저 읽고
 * 가격 없는 조건은 그 뒤에 읽는다. 항목을 빼지 않고 순서만 바꾸므로 "더 보기"로 모든 항목에 닿는다.
 */
function streamOrder(streamCount: number, priced?: readonly boolean[]) {
  const all = Array.from({ length: streamCount }, (_, index) => index);
  if (!priced) return all;
  return [
    ...all.filter((index) => priced[index]),
    ...all.filter((index) => !priced[index]),
  ];
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
  const order =
    allPages[0]?.order ?? streamOrder(totals.length, allPages[0]?.priced);
  const next = order
    .slice(order.indexOf(stream) + 1)
    .find((index) => (totals[index] ?? 0) > 0);
  return next === undefined ? undefined : { stream: next, page: 0 };
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
      return { ...page, pricedFirst };
    },
  });
}

/**
 * 가격 있는 항목을 아직 못 찾았을 때 더 읽어서 찾을 수 있는지. 목록이 가격 있는 항목을 먼저 주면(#24) 가격 있는 조건을 먼저 읽으므로
 * 아직 없다면 어디에도 없다. 이전 백엔드면 알 수 없으므로 늘 그렇다고 본다.
 */
export function mayFindMorePriced(
  pages: readonly Pick<MergedPage<unknown>, 'pricedFirst'>[],
) {
  return !pages.every((page) => page.pricedFirst);
}

/** 가격 유무를 붙인다. 목록에 요약이 있으면 상세 화면과 같은 키로 캐시에 넣고, 없으면(이전 백엔드) 항목마다 함께 요청한다. */
async function withPrices(
  client: QueryClient,
  params: ItemSearchParams,
  page: MergedPage<ListedItem>,
  listedAt: number,
): Promise<MergedPage<ItemResult>> {
  const content = await Promise.all(
    page.content.map(({ priceSummary, ...item }) => {
      const summary = npayQueries.summaryIn(item.code, params.sidoCodes);
      if (priceSummary) {
        /** 상세 화면이 그 뒤에 받은 요약이 있으면 목록의 값으로 덮지 않는다. */
        const cachedAt =
          client.getQueryState(summary.queryKey)?.dataUpdatedAt ?? 0;
        if (cachedAt <= listedAt)
          client.setQueryData(summary.queryKey, priceSummary, {
            updatedAt: listedAt,
          });
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
  void loadPage(client, params, next).catch(() => undefined);
}

/** 목록 페이지를 받고(캐시가 있으면 그것을) 가격 유무를 붙인다. onListed는 요약을 기다리기 전에 부른다. */
async function loadPage(
  client: QueryClient,
  params: ItemSearchParams,
  cursor: StreamCursor,
  onListed?: typeof prefetchFollowing,
) {
  const listOptions = itemListPage(params, cursor);
  const listed = await client.fetchQuery(listOptions);
  onListed?.(client, params, listed);
  const listedAt =
    client.getQueryState(listOptions.queryKey)?.dataUpdatedAt ?? Date.now();
  return withPrices(client, params, listed, listedAt);
}

export const searchQueries = {
  /** 페이지마다 항목별 가격 요약을 캐시에 채워 두고 가격 유무를 붙인다. 화면이 가격 없는 항목을 따로 모아도 행이 나중에 움직이지 않는다. */
  items: (params: ItemSearchParams) =>
    infiniteQueryOptions({
      queryKey: searchKeys.items(params),
      queryFn: ({ pageParam, client }) =>
        loadPage(client, params, pageParam, prefetchFollowing),
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
