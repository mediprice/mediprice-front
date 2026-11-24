import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { npayKeys, npayQueries } from '@/features/npay/queries';
import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import type * as ApiModule from './api';
import {
  mayFindMorePriced,
  searchKeys,
  searchQueries,
  totalCount,
} from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

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

function item(code: string, categoryCode = '1070Z') {
  return {
    code,
    name: `이학요법료/${code}`,
    mdivCode: categoryCode,
    mdivName: '이학요법료',
    sdivCode: `${categoryCode}050`,
    sdivName: '도수치료',
  };
}

function page<T>(
  content: T[],
  pageIndex: number,
  totalElements: number,
  size = 10,
) {
  return {
    content,
    page: pageIndex,
    size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
}

function summary(npayCode: string, avgPrice: number | null) {
  return {
    npayCode,
    minPrice: avgPrice,
    maxPrice: avgPrice,
    avgPrice,
    priceCount: avgPrice == null ? 0 : 1,
    hospitalCount: avgPrice == null ? 0 : 1,
  };
}

/** 항목마다 가격 요약을 돌려준다. unpriced에 든 코드는 가격이 없다. */
function serveSummaries(unpriced: string[] = [], sidoCodes: string[] = []) {
  server.use(
    http.get(
      `${BASE}/api/npay-items/:code/price-summary`,
      ({ params, request }) => {
        const code = String(params.code);
        sidoCodes.push(new URL(request.url).searchParams.get('sidoCode') ?? '');
        return HttpResponse.json(
          summary(code, unpriced.includes(code) ? null : 10000),
        );
      },
    ),
  );
  return sidoCodes;
}

/** 분류 코드별 전체 항목을 페이지로 잘라 돌려주는 가짜 백엔드 */
function serveItems(byCode: Record<string, number>, requests: URL[] = []) {
  server.use(
    http.get(`${BASE}/api/npay-items`, ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const code = url.searchParams.get('categoryCode') ?? '';
      const index = Number(url.searchParams.get('page'));
      const size = Number(url.searchParams.get('size'));
      const total = byCode[code] ?? 0;
      const content = Array.from(
        { length: Math.max(0, Math.min(size, total - index * size)) },
        (_, i) => item(`${code}-${index * size + i}`, code),
      );
      return HttpResponse.json(page(content, index, total));
    }),
  );
  return requests;
}

describe('searchQueries.items', () => {
  it('검색어와 페이지를 평평한 쿼리 문자열로 보낸다', async () => {
    serveSummaries();
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/npay-items`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page([item('MX1220000')], 0, 1));
      }),
    );

    const data = await new QueryClient().fetchInfiniteQuery(
      searchQueries.items({ keyword: '도수', sidoCodes: [] }),
    );

    expect(url?.searchParams.get('keyword')).toBe('도수');
    expect(url?.searchParams.has('categoryCode')).toBe(false);
    expect(url?.searchParams.get('page')).toBe('0');
    expect(url?.searchParams.get('size')).toBe('10');
    expect(data.pages[0]?.content.map(({ code }) => code)).toEqual([
      'MX1220000',
    ]);
    expect(totalCount(data.pages)).toBe(1);
  });

  it('분류 코드가 여럿이면 전체 개수를 합치고 코드 순서대로 이어서 불러온다', async () => {
    serveItems({ '1100Z': 15, '1180Z': 3 });
    serveSummaries();
    const queryClient = new QueryClient();
    const options = searchQueries.items({
      categoryCodes: ['1100Z', '1180Z'],
      sidoCodes: [],
    });

    const data = await queryClient.fetchInfiniteQuery({ ...options, pages: 3 });

    expect(totalCount(data.pages)).toBe(18);
    expect(data.pages.map((p) => p.content.length)).toEqual([10, 5, 3]);
    expect(data.pages[2]?.content[0]?.code).toBe('1180Z-0');
    expect(
      options.getNextPageParam(
        data.pages[2]!,
        data.pages,
        { stream: 0, page: 0 },
        [],
      ),
    ).toBeUndefined();
  });

  it('결과가 없는 분류 코드는 건너뛴다', async () => {
    serveItems({ '1032A': 0, '1032B': 2, '1025A': 0, '1025B': 1 });
    serveSummaries();
    const options = searchQueries.items({
      categoryCodes: ['1032A', '1032B', '1025A', '1025B'],
      sidoCodes: [],
    });

    const data = await new QueryClient().fetchInfiniteQuery({
      ...options,
      pages: 2,
    });

    expect(totalCount(data.pages)).toBe(3);
    expect(data.pages[0]?.content.map(({ code }) => code)).toEqual([
      '1032B-0',
      '1032B-1',
    ]);
    expect(data.pages[1]?.content.map(({ code }) => code)).toEqual(['1025B-0']);
    expect(
      options.getNextPageParam(
        data.pages[1]!,
        data.pages,
        { stream: 0, page: 0 },
        [],
      ),
    ).toBeUndefined();
  });

  it('하나라도 실패하면 ApiError로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/npay-items`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '오류', errors: [] },
          { status: 500 },
        ),
      ),
    );

    const promise = new QueryClient().fetchInfiniteQuery(
      searchQueries.items({ categoryCodes: ['1100Z', '1180Z'], sidoCodes: [] }),
    );

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});

describe('searchQueries.items 가격 유무', () => {
  it('지역의 시도마다 요약을 받아 가격 유무를 붙이고, 요약은 행이 다시 쓰도록 캐시에 남긴다', async () => {
    serveItems({ '1070Z': 3 });
    const sidoCodes = serveSummaries(['1070Z-1']);
    const queryClient = new QueryClient();

    const data = await queryClient.fetchInfiniteQuery(
      searchQueries.items({
        categoryCodes: ['1070Z'],
        sidoCodes: ['110000', '310000'],
      }),
    );

    expect(
      data.pages[0]?.content.map(({ code, hasPrice }) => [code, hasPrice]),
    ).toEqual([
      ['1070Z-0', true],
      ['1070Z-1', false],
      ['1070Z-2', true],
    ]);
    expect(new Set(sidoCodes)).toEqual(new Set(['110000', '310000']));
    expect(sidoCodes).toHaveLength(6);
    expect(
      queryClient.getQueryData(
        npayQueries.summaryIn('1070Z-0', ['110000', '310000']).queryKey,
      )?.avgPrice,
    ).toBe(10000);
  });

  it('요약 조회가 실패한 항목은 가격 유무를 모름(null)으로 두고 목록은 그대로 보여 준다', async () => {
    serveItems({ '1070Z': 1 });
    server.use(
      http.get(`${BASE}/api/npay-items/:code/price-summary`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '오류', errors: [] },
          { status: 500 },
        ),
      ),
    );

    const data = await new QueryClient().fetchInfiniteQuery(
      searchQueries.items({ categoryCodes: ['1070Z'], sidoCodes: [] }),
    );

    expect(data.pages[0]?.content[0]?.hasPrice).toBeNull();
  });
});

describe('searchQueries.items 이어 읽기', () => {
  const params = { categoryCodes: ['1070Z'], sidoCodes: ['110000'] };
  const listPages = (requests: URL[]) =>
    requests.map((url) => Number(url.searchParams.get('page')));

  async function observe(queryClient: QueryClient) {
    const observer = new InfiniteQueryObserver(
      queryClient,
      searchQueries.items(params),
    );
    const unsubscribe = observer.subscribe(() => {});
    await vi.waitFor(() =>
      expect(observer.getCurrentResult().isSuccess).toBe(true),
    );
    return { observer, unsubscribe };
  }

  it('한 페이지의 항목 요약은 차례로가 아니라 함께 요청한다', async () => {
    serveItems({ '1070Z': 5 });
    let inFlight = 0;
    let maxInFlight = 0;
    server.use(
      http.get(
        `${BASE}/api/npay-items/:code/price-summary`,
        async ({ params: p }) => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 10));
          inFlight -= 1;
          return HttpResponse.json(summary(String(p.code), 10000));
        },
      ),
    );

    await new QueryClient().fetchInfiniteQuery(searchQueries.items(params));

    expect(maxInFlight).toBe(5);
  });

  it('가격 있는 항목이 아직 없으면 다음 페이지를 지금 페이지 요약과 함께 미리 받는다', async () => {
    const requests = serveItems({ '1070Z': 40 });
    serveSummaries(Array.from({ length: 40 }, (_, i) => `1070Z-${i}`));
    const queryClient = new QueryClient();
    const { observer, unsubscribe } = await observe(queryClient);
    expect(listPages(requests)).toEqual([0]);

    await observer.fetchNextPage();
    await vi.waitFor(() => expect(listPages(requests)).toEqual([0, 1, 2]));
    await observer.fetchNextPage();
    await vi.waitFor(() => expect(listPages(requests)).toEqual([0, 1, 2, 3]));

    expect(
      observer
        .getCurrentResult()
        .data?.pages.map((page) => page.content.map((row) => row.code)),
    ).toEqual(
      [0, 1, 2].map((index) =>
        Array.from({ length: 10 }, (_, i) => `1070Z-${index * 10 + i}`),
      ),
    );
    unsubscribe();
  });

  it('가격 있는 항목이 이미 있으면 미리 받지 않는다', async () => {
    const requests = serveItems({ '1070Z': 40 });
    serveSummaries();
    const queryClient = new QueryClient();
    const { observer, unsubscribe } = await observe(queryClient);

    await observer.fetchNextPage();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(listPages(requests)).toEqual([0, 1]);
    unsubscribe();
  });
});

describe('searchQueries.items 목록에 든 가격 요약(백엔드 #24)', () => {
  const params = { categoryCodes: ['1070Z'], sidoCodes: ['110000', '310000'] };

  /** 새 백엔드처럼 항목마다 priceSummary를 넣고 가격 있는 항목을 먼저 준다. */
  function serveItemsWithSummaries(
    codes: { code: string; avgPrice: number | null }[],
    requests: URL[] = [],
    totalElements = codes.length,
  ) {
    server.use(
      http.get(`${BASE}/api/npay-items`, ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const content = codes.map(({ code, avgPrice }) => ({
          ...item(code),
          priceSummary: summary(code, avgPrice),
        }));
        return HttpResponse.json(
          page(content, Number(url.searchParams.get('page')), totalElements),
        );
      }),
    );
    return requests;
  }

  it('목록의 요약으로 가격 유무를 붙이고 항목별 요약을 따로 부르지 않는다', async () => {
    const requests = serveItemsWithSummaries([
      { code: 'A', avgPrice: 10000 },
      { code: 'B', avgPrice: null },
    ]);
    const perItem = vi.fn(() => HttpResponse.json(summary('A', 1)));
    server.use(http.get(`${BASE}/api/npay-items/:code/price-summary`, perItem));
    const queryClient = new QueryClient();

    const data = await queryClient.fetchInfiniteQuery(
      searchQueries.items(params),
    );

    expect(
      data.pages[0]?.content.map(({ code, hasPrice }) => [code, hasPrice]),
    ).toEqual([
      ['A', true],
      ['B', false],
    ]);
    expect(perItem).not.toHaveBeenCalled();
    expect(requests[0]?.searchParams.get('sidoCode')).toBe('110000,310000');
    expect(requests[0]?.searchParams.get('withPriceSummary')).toBe('true');
    expect(requests[0]?.searchParams.get('pricedFirst')).toBe('true');
    expect(
      queryClient.getQueryData(npayKeys.summaryIn('A', params.sidoCodes)),
    ).toEqual(summary('A', 10000));
  });

  it('가격 있는 항목을 먼저 받으므로 첫 페이지에 없으면 저절로 더 읽지 않는다', async () => {
    const requests = serveItemsWithSummaries(
      Array.from({ length: 10 }, (_, i) => ({ code: `N${i}`, avgPrice: null })),
      [],
      40,
    );
    const queryClient = new QueryClient();

    const data = await queryClient.fetchInfiniteQuery(
      searchQueries.items(params),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(mayFindMorePriced(data.pages)).toBe(false);
    expect(requests).toHaveLength(1);
  });

  it('이전 백엔드(요약 없음)면 예전처럼 더 읽을 수 있다고 본다', async () => {
    serveItems({ '1070Z': 40 });
    serveSummaries(Array.from({ length: 40 }, (_, i) => `1070Z-${i}`));

    const data = await new QueryClient().fetchInfiniteQuery(
      searchQueries.items(params),
    );

    expect(mayFindMorePriced(data.pages)).toBe(true);
  });

  /** 분류마다 항목 수와 가격 유무를 정해 새 백엔드처럼 답한다. */
  function serveCategories(
    byCode: Record<string, { total: number; avgPrice: number | null }>,
    requests: string[] = [],
  ) {
    server.use(
      http.get(`${BASE}/api/npay-items`, ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('categoryCode') ?? '';
        const index = Number(url.searchParams.get('page'));
        const size = Number(url.searchParams.get('size'));
        requests.push(`${code}:${index}`);
        const { total, avgPrice } = byCode[code] ?? {
          total: 0,
          avgPrice: null,
        };
        const content = Array.from(
          { length: Math.max(0, Math.min(size, total - index * size)) },
          (_, i) => {
            const itemCode = `${code}-${index * size + i}`;
            return {
              ...item(itemCode, code),
              priceSummary: summary(itemCode, avgPrice),
            };
          },
        );
        return HttpResponse.json(page(content, index, total));
      }),
    );
    return requests;
  }

  it('분류가 여러 개면 가격 있는 분류를 먼저 보여 주고 가격 없는 분류는 그 뒤에 읽는다', async () => {
    const requests = serveCategories({
      '1070Z': { total: 15, avgPrice: null },
      '1180Z': { total: 3, avgPrice: 5000 },
    });

    const observer = new InfiniteQueryObserver(
      new QueryClient(),
      searchQueries.items({ ...params, categoryCodes: ['1070Z', '1180Z'] }),
    );
    const unsubscribe = observer.subscribe(() => {});
    await vi.waitFor(() =>
      expect(observer.getCurrentResult().isSuccess).toBe(true),
    );
    await observer.fetchNextPage();
    await observer.fetchNextPage();
    unsubscribe();
    const data = observer.getCurrentResult().data;
    if (!data) throw new Error('no data');

    expect(requests).toEqual(['1070Z:0', '1180Z:0', '1070Z:0', '1070Z:1']);
    expect(data.pages.map((p) => p.content[0]?.code)).toEqual([
      '1180Z-0',
      '1070Z-0',
      '1070Z-10',
    ]);
    expect(data.pages.flatMap((p) => p.content)).toHaveLength(18);
    expect(mayFindMorePriced(data.pages)).toBe(false);
  });

  it('요약이 있는 항목과 없는 항목이 섞이면 없는 항목만 따로 읽고 이어 읽기를 막지 않는다', async () => {
    server.use(
      http.get(`${BASE}/api/npay-items`, () =>
        HttpResponse.json(
          page(
            [{ ...item('A'), priceSummary: summary('A', 10000) }, item('B')],
            0,
            2,
          ),
        ),
      ),
    );
    const perItem: string[] = [];
    server.use(
      http.get(
        `${BASE}/api/npay-items/:code/price-summary`,
        ({ params: p }) => {
          perItem.push(String(p.code));
          return HttpResponse.json(summary(String(p.code), null));
        },
      ),
    );

    const data = await new QueryClient().fetchInfiniteQuery(
      searchQueries.items(params),
    );

    expect(
      data.pages[0]?.content.map(({ code, hasPrice }) => [code, hasPrice]),
    ).toEqual([
      ['A', true],
      ['B', false],
    ]);
    expect([...new Set(perItem)]).toEqual(['B']);
    expect(data.pages[0]?.pricedFirst).toBe(false);
    expect(mayFindMorePriced(data.pages)).toBe(true);
  });

  it('priceSummary가 null이면 요약이 없는 것으로 보고 항목마다 읽는다', async () => {
    server.use(
      http.get(`${BASE}/api/npay-items`, () =>
        HttpResponse.json(page([{ ...item('A'), priceSummary: null }], 0, 1)),
      ),
    );
    const perItem = vi.fn(() => HttpResponse.json(summary('A', 7000)));
    server.use(http.get(`${BASE}/api/npay-items/:code/price-summary`, perItem));

    const data = await new QueryClient().fetchInfiniteQuery(
      searchQueries.items(params),
    );

    expect(data.pages[0]?.content[0]?.hasPrice).toBe(true);
    expect(perItem).toHaveBeenCalled();
    expect(data.pages[0]?.pricedFirst).toBe(false);
  });

  it('목록의 요약은 그 뒤에 받은 상세 요약을 덮지 않는다', async () => {
    serveItemsWithSummaries([{ code: 'A', avgPrice: 10000 }]);
    const queryClient = new QueryClient();
    const key = npayQueries.summaryIn('A', params.sidoCodes).queryKey;
    const newer = summary('A', 12345);
    queryClient.setQueryData(key, newer, { updatedAt: Date.now() + 60_000 });

    await queryClient.fetchInfiniteQuery(searchQueries.items(params));

    expect(queryClient.getQueryData(key)).toEqual(newer);
  });
});

describe('searchQueries.hospitals', () => {
  it('시도 코드마다 차례로 조회해 서울·경기를 하나의 목록으로 만든다', async () => {
    const sidoCodes: (string | null)[] = [];
    server.use(
      http.get(`${BASE}/api/hospitals`, ({ request }) => {
        const url = new URL(request.url);
        const sidoCode = url.searchParams.get('sidoCode');
        sidoCodes.push(sidoCode);
        const hospital = {
          ykiho: `${sidoCode}-1`,
          name: '정형외과의원',
          className: '의원',
          sidoName: null,
          sgguName: null,
          address: null,
          phone: null,
        };
        expect(url.searchParams.get('keyword')).toBe('정형');
        return HttpResponse.json(page([hospital], 0, 1, 20));
      }),
    );
    const options = searchQueries.hospitals({
      keyword: '정형',
      sidoCodes: ['110000', '310000'],
    });

    const data = await new QueryClient().fetchInfiniteQuery({
      ...options,
      pages: 2,
    });

    expect(sidoCodes).toEqual(['110000', '310000', '310000']);
    expect(totalCount(data.pages)).toBe(2);
    expect(data.pages.flatMap((p) => p.content.map((h) => h.ykiho))).toEqual([
      '110000-1',
      '310000-1',
    ]);
  });

  it('검색어 없는 요청은 백엔드가 INVALID_INPUT으로 거부한다', async () => {
    server.use(
      http.get(`${BASE}/api/hospitals`, () =>
        HttpResponse.json(
          { code: 'INVALID_INPUT', message: '잘못된 요청', errors: [] },
          { status: 400 },
        ),
      ),
    );

    const promise = new QueryClient().fetchInfiniteQuery(
      searchQueries.hospitals({ keyword: '', sidoCodes: ['110000'] }),
    );

    await expect(promise).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_INPUT',
    });
  });
});

describe('searchKeys', () => {
  it('키는 도메인에서 조건으로 좁혀지는 계층이다', () => {
    const key = searchKeys.items({ keyword: '도수', sidoCodes: [] });
    expect(key.slice(0, searchKeys.all.length)).toEqual(searchKeys.all);
    expect(key).not.toEqual(
      searchKeys.items({ keyword: '라식', sidoCodes: [] }),
    );
    expect(key).not.toEqual(
      searchKeys.items({ keyword: '도수', sidoCodes: ['110000'] }),
    );
    expect(
      searchKeys.hospitals({ keyword: '도수', sidoCodes: [] }),
    ).not.toEqual(key);
  });
});
