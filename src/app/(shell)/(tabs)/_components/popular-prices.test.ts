import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { npayKeys } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import { API, server } from '@/test/server';

import { popularCodesOf, prefetchPopularPrices } from './popular-prices';

const SUMMARY = `${API}/api/npay-items/:code/price-summary`;

function summaryOf(code: string, sidoCode: string | null) {
  return {
    npayCode: code,
    minPrice: 1000,
    maxPrice: sidoCode === '110000' ? 9000 : 5000,
    avgPrice: 4000,
    priceCount: 10,
    hospitalCount: 5,
  };
}

describe('popularCodesOf', () => {
  it('순위가 6개 이상이면 위의 6개를 쓴다', () => {
    const ranked = Array.from({ length: 7 }, (_, index) => ({
      code: `C${index}`,
    }));
    expect(popularCodesOf(ranked)).toEqual([
      'C0',
      'C1',
      'C2',
      'C3',
      'C4',
      'C5',
    ]);
  });

  it('순위가 모자라면 고른 목록을 쓴다', () => {
    expect(popularCodesOf([{ code: 'C0' }])).toEqual(
      POPULAR_ITEMS.map((item) => item.code),
    );
  });
});

describe('prefetchPopularPrices', () => {
  it('카드가 읽는 서울·경기 요약을 같은 키로 채워 넘긴다', async () => {
    const requested: string[] = [];
    server.use(
      http.get(SUMMARY, ({ request, params }) => {
        const sidoCode = new URL(request.url).searchParams.get('sidoCode');
        requested.push(`${String(params.code)}:${sidoCode}`);
        return HttpResponse.json(summaryOf(String(params.code), sidoCode));
      }),
    );

    const state = await prefetchPopularPrices(['A1', 'B2']);

    expect(requested.sort()).toEqual([
      'A1:110000',
      'A1:310000',
      'B2:110000',
      'B2:310000',
    ]);
    const keys = state.queries.map((query) => query.queryKey);
    expect(keys).toEqual([
      npayKeys.summaryIn('A1', sidoCodesOf(DEFAULT_REGION)),
      npayKeys.summaryIn('B2', sidoCodesOf(DEFAULT_REGION)),
    ]);
    expect(state.queries[0]?.state).toMatchObject({
      status: 'success',
      data: { npayCode: 'A1', minPrice: 1000, maxPrice: 9000 },
    });
  });

  it('실패한 항목은 넘기지 않아 브라우저가 다시 읽는다', async () => {
    server.use(
      http.get(SUMMARY, ({ request, params }) =>
        params.code === 'BAD'
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json(
              summaryOf(
                String(params.code),
                new URL(request.url).searchParams.get('sidoCode'),
              ),
            ),
      ),
    );

    const state = await prefetchPopularPrices(['OK', 'BAD']);

    expect(state.queries.map((query) => query.queryKey)).toEqual([
      npayKeys.summaryIn('OK', sidoCodesOf(DEFAULT_REGION)),
    ]);
  });
});
