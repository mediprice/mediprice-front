import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { npayKeys, npayQueries } from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';
const PRICES = `${BASE}/api/npay-items/MX1220000/prices`;

function pricePage(page: number, totalPages: number) {
  return {
    content: [
      {
        ykiho: `ykiho-${page}`,
        hospitalName: '테스트병원',
        className: '병원',
        sidoName: '서울',
        sgguName: '강남구',
        address: null,
        itemName: '도수치료',
        price: 50000,
        startDate: '2026-09-03',
      },
    ],
    page,
    size: 20,
    totalElements: totalPages,
    totalPages,
  };
}

describe('npayQueries.detail', () => {
  it('없는 항목은 ApiError(NPAY_ITEM_NOT_FOUND)로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/npay-items/NOPE`, () =>
        HttpResponse.json(
          { code: 'NPAY_ITEM_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    const promise = new QueryClient().fetchQuery(npayQueries.detail('NOPE'));

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      code: 'NPAY_ITEM_NOT_FOUND',
    });
  });
});

describe('npayQueries.summary', () => {
  it('조건 객체를 평평한 쿼리 파라미터로 보낸다', async () => {
    let search = '';
    server.use(
      http.get(
        `${BASE}/api/npay-items/MX1220000/price-summary`,
        ({ request }) => {
          search = new URL(request.url).search;
          return HttpResponse.json({
            npayCode: 'MX1220000',
            minPrice: 1000,
            maxPrice: 500000,
            avgPrice: 126426,
            priceCount: 1158,
            hospitalCount: 327,
          });
        },
      ),
    );

    const data = await new QueryClient().fetchQuery(
      npayQueries.summary('MX1220000', {
        sidoCode: '110000',
        institutionCode: '21',
      }),
    );

    expect(data.hospitalCount).toBe(327);
    expect(new URLSearchParams(search).get('sidoCode')).toBe('110000');
    expect(new URLSearchParams(search).get('institutionCode')).toBe('21');
    expect(new URLSearchParams(search).has('sgguCode')).toBe(false);
  });
});

describe('npayQueries.priceList', () => {
  it('첫 페이지는 0번부터 20개씩 정렬·조건과 함께 요청한다', async () => {
    let search = new URLSearchParams();
    server.use(
      http.get(PRICES, ({ request }) => {
        search = new URL(request.url).searchParams;
        return HttpResponse.json(pricePage(0, 3));
      }),
    );

    const data = await new QueryClient().fetchInfiniteQuery(
      npayQueries.priceList('MX1220000', {
        condition: { sidoCode: '110000' },
        sortCondition: { sort: 'price_desc' },
      }),
    );

    expect(data.pages).toHaveLength(1);
    expect(Object.fromEntries(search)).toEqual({
      sidoCode: '110000',
      sort: 'price_desc',
      page: '0',
      size: '20',
    });
  });

  it('다음 페이지는 마지막 페이지 번호 + 1이고, 끝이면 없다', () => {
    const { getNextPageParam } = npayQueries.priceList('MX1220000', {
      condition: {},
      sortCondition: { sort: 'price_asc' },
    });

    expect(getNextPageParam(pricePage(0, 3), [], 0, [])).toBe(1);
    expect(getNextPageParam(pricePage(2, 3), [], 2, [])).toBeUndefined();
    expect(getNextPageParam(pricePage(0, 0), [], 0, [])).toBeUndefined();
  });

  it('더 불러오기는 다음 페이지 번호로 요청해 페이지를 이어 붙인다', async () => {
    const requested: string[] = [];
    server.use(
      http.get(PRICES, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        requested.push(String(page));
        return HttpResponse.json(pricePage(page, 2));
      }),
    );
    const client = new QueryClient();
    const options = npayQueries.priceList('MX1220000', {
      condition: {},
      sortCondition: { sort: 'price_asc' },
    });

    await client.fetchInfiniteQuery(options);
    const data = await client.fetchInfiniteQuery({ ...options, pages: 2 });

    expect(requested).toContain('1');
    expect(data.pages.map((page) => page.page)).toEqual([0, 1]);
  });

  it('잘못된 정렬 값은 ApiError(INVALID_INPUT)로 실패한다', async () => {
    server.use(
      http.get(PRICES, () =>
        HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '잘못된 요청입니다.',
            errors: [{ field: 'sort', reason: 'must match' }],
          },
          { status: 400 },
        ),
      ),
    );

    const promise = new QueryClient().fetchInfiniteQuery(
      npayQueries.priceList('MX1220000', {
        condition: {},
        sortCondition: { sort: 'bogus' },
      }),
    );

    await expect(promise).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_INPUT',
    });
  });

  it('목록 키는 항목 키 아래에 있고 조건이 다르면 달라진다', () => {
    const asc = npayKeys.priceList('MX1220000', {
      condition: {},
      sortCondition: { sort: 'price_asc' },
    });
    const desc = npayKeys.priceList('MX1220000', {
      condition: {},
      sortCondition: { sort: 'price_desc' },
    });

    expect(asc.slice(0, 3)).toEqual(npayKeys.detail('MX1220000'));
    expect(asc).not.toEqual(desc);
    expect(asc).not.toEqual(
      npayKeys.prices('MX1220000', {
        condition: {},
        sortCondition: { sort: 'price_asc' },
        pageQuery: {},
      }),
    );
  });
});
