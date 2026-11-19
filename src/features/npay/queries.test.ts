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

describe('npayQueries.summaryOf', () => {
  it('조건마다 요약을 받아 병원·가격 수를 더한다', async () => {
    const seen: string[] = [];
    server.use(
      http.get(
        `${BASE}/api/npay-items/MX1220000/price-summary`,
        ({ request }) => {
          const search = new URL(request.url).searchParams;
          seen.push(search.toString());
          const isSeoul = search.get('sidoCode') === '110000';
          return HttpResponse.json({
            npayCode: 'MX1220000',
            minPrice: isSeoul ? 1000 : 2000,
            maxPrice: isSeoul ? 9000 : 8000,
            avgPrice: isSeoul ? 4000 : 6000,
            priceCount: 10,
            hospitalCount: isSeoul ? 3 : 4,
          });
        },
      ),
    );

    const data = await new QueryClient().fetchQuery(
      npayQueries.summaryOf('MX1220000', [
        { sidoCode: '110000', institutionCode: '21' },
        { sidoCode: '310000', institutionCode: '21' },
      ]),
    );

    expect(seen).toEqual([
      'sidoCode=110000&institutionCode=21',
      'sidoCode=310000&institutionCode=21',
    ]);
    expect(data).toMatchObject({
      minPrice: 1000,
      maxPrice: 9000,
      avgPrice: 5000,
      hospitalCount: 7,
      priceCount: 20,
    });
  });
});

describe('npayQueries.priceList', () => {
  it('서울·경기 목록을 가격순으로 합치고 각 목록을 정렬·조건과 함께 요청한다', async () => {
    const requests: Record<string, string>[] = [];
    server.use(
      http.get(PRICES, ({ request }) => {
        const search = new URL(request.url).searchParams;
        requests.push(Object.fromEntries(search));
        const sido = search.get('sidoCode');
        const base = sido === '110000' ? [1000, 3000] : [2000, 4000];
        return HttpResponse.json({
          ...pricePage(0, 1),
          content: base.map((price) => ({
            ...pricePage(0, 1).content[0],
            ykiho: `${sido}-${price}`,
            price,
          })),
          totalElements: 2,
        });
      }),
    );

    const data = await new QueryClient().fetchInfiniteQuery(
      npayQueries.priceList('MX1220000', {
        conditions: [
          { sidoCode: '110000', institutionCode: '21' },
          { sidoCode: '310000', institutionCode: '21' },
        ],
        sort: 'price_asc',
      }),
    );

    expect(data.pages[0]?.rows.map((row) => row.price)).toEqual([
      1000, 2000, 3000, 4000,
    ]);
    expect(data.pages[0]?.next).toBeUndefined();
    expect(requests).toContainEqual({
      sidoCode: '310000',
      institutionCode: '21',
      sort: 'price_asc',
      page: '0',
      size: '30',
    });
  });

  it('조건이 없으면(전국) 조건 없는 목록 하나를 읽는다', async () => {
    let search = new URLSearchParams();
    server.use(
      http.get(PRICES, ({ request }) => {
        search = new URL(request.url).searchParams;
        return HttpResponse.json(pricePage(0, 1));
      }),
    );

    await new QueryClient().fetchInfiniteQuery(
      npayQueries.priceList('MX1220000', {
        conditions: [],
        sort: 'price_desc',
      }),
    );

    expect(Object.fromEntries(search)).toEqual({
      sort: 'price_desc',
      page: '0',
      size: '30',
    });
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
        conditions: [],
        // @ts-expect-error 런타임에 잘못된 값이 와도 백엔드 오류로 끝나는지 본다
        sort: 'bogus',
      }),
    );

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_INPUT',
    });
  });

  it('목록 키는 항목 키 아래에 있고 조건이 다르면 달라진다', () => {
    const asc = npayKeys.priceList('MX1220000', {
      conditions: [],
      sort: 'price_asc',
    });
    const desc = npayKeys.priceList('MX1220000', {
      conditions: [],
      sort: 'price_desc',
    });

    expect(asc.slice(0, 3)).toEqual(npayKeys.detail('MX1220000'));
    expect(asc).not.toEqual(desc);
  });
});
