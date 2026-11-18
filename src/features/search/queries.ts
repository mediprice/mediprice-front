import { infiniteQueryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

const PAGE_SIZE = 20;

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
};

export type ItemSearchParams = {
  keyword?: string;
  /** 비어 있으면 분류 조건 없이 검색한다. 백엔드는 코드 하나만 받으므로 여러 개는 차례로 조회한다. */
  categoryCodes?: readonly string[];
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

export const searchQueries = {
  items: (params: ItemSearchParams) =>
    infiniteQueryOptions({
      queryKey: searchKeys.items(params),
      queryFn: ({ pageParam }) =>
        fetchMergedPage<Schemas['NpayItemResponse']>(
          (stream, page) =>
            unwrap(
              apiClient.GET('/api/npay-items', {
                params: {
                  query: {
                    condition: {
                      keyword: params.keyword,
                      categoryCode: params.categoryCodes?.[stream],
                    },
                    pageQuery: { page, size: PAGE_SIZE },
                  },
                },
              }),
            ),
          Math.max(1, params.categoryCodes?.length ?? 0),
          pageParam,
        ),
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
                    pageQuery: { page, size: PAGE_SIZE },
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
