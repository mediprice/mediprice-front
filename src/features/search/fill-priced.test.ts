import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/server';

import type * as ApiModule from './api';
import { shouldFillPriced } from './fill-priced';
import { mayFindMorePriced, searchQueries } from './queries';

const BASE = 'http://app.test/bff';

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>();
  const { createUntypedRequest } = await import('@/lib/api/untyped-request');
  return {
    ...actual,
    searchApi: actual.createSearchApi(
      createUntypedRequest({ baseUrl: 'http://app.test/bff' }),
    ),
  };
});

/** 가격 없는 항목 10개짜리 첫 페이지(전체 40개). withSummary면 새 백엔드 응답이다. */
function serveUnpricedPage(withSummary: boolean) {
  server.use(
    http.get(`${BASE}/api/npay-items`, () =>
      HttpResponse.json({
        content: Array.from({ length: 10 }, (_, i) => ({
          code: `N${i}`,
          name: `항목${i}`,
          mdivCode: null,
          mdivName: null,
          sdivCode: null,
          sdivName: null,
          ...(withSummary && {
            priceSummary: {
              npayCode: `N${i}`,
              minPrice: null,
              maxPrice: null,
              avgPrice: null,
              priceCount: 0,
              hospitalCount: 0,
            },
          }),
        })),
        page: 0,
        size: 10,
        totalElements: 40,
        totalPages: 4,
      }),
    ),
    http.get(`${BASE}/api/npay-items/:code/price-summary`, ({ params }) =>
      HttpResponse.json({
        npayCode: String(params.code),
        minPrice: null,
        maxPrice: null,
        avgPrice: null,
        priceCount: 0,
        hospitalCount: 0,
      }),
    ),
  );
}

async function fillAfterFirstPage() {
  const data = await new QueryClient().fetchInfiniteQuery(
    searchQueries.items({ keyword: '검사', sidoCodes: ['110000'] }),
  );
  return shouldFillPriced({
    pages: data.pages.map((page) => page.content),
    hasNextPage: true,
    isFetchingNextPage: false,
    isError: false,
    canFindMore: mayFindMorePriced(data.pages),
  });
}

describe('shouldFillPriced', () => {
  it('가격 있는 항목을 먼저 주는 새 응답이면 첫 페이지에 가격이 없어도 더 읽지 않는다', async () => {
    serveUnpricedPage(true);
    expect(await fillAfterFirstPage()).toBe(false);
  });

  it('이전 백엔드 응답이면 예전처럼 다음 페이지를 저절로 읽는다', async () => {
    serveUnpricedPage(false);
    expect(await fillAfterFirstPage()).toBe(true);
  });
});
