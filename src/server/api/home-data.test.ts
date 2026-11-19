import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { API, server } from '@/test/server';

import { fetchPopularItems, fetchSiteStats } from './home-data';

describe('fetchSiteStats', () => {
  it('통계를 검증해 돌려준다', async () => {
    server.use(
      http.get(`${API}/api/stats`, () =>
        HttpResponse.json({
          hospitalCount: 12_000,
          npayItemCount: 900,
          priceCount: 280_000,
          dataDate: '2026-11-18',
        }),
      ),
    );

    expect(await fetchSiteStats()).toEqual({
      hospitalCount: 12_000,
      npayItemCount: 900,
      priceCount: 280_000,
      dataDate: '2026-11-18',
    });
  });

  it.each([
    ['아직 배포 전(404)', () => new HttpResponse(null, { status: 404 })],
    ['장애', () => HttpResponse.error()],
    ['형식이 다름', () => HttpResponse.json({ hospitalCount: '많음' })],
  ])('%s이면 null이다', async (_, resolver) => {
    server.use(http.get(`${API}/api/stats`, resolver));

    expect(await fetchSiteStats()).toBeNull();
  });
});

describe('fetchPopularItems', () => {
  it('limit을 넘기고 순위를 돌려준다', async () => {
    let limit: string | null = null;
    server.use(
      http.get(`${API}/api/npay-items/popular`, ({ request }) => {
        limit = new URL(request.url).searchParams.get('limit');
        return HttpResponse.json([
          {
            rank: 1,
            npayCode: 'MX1220000',
            name: '도수치료',
            mdivName: null,
            sdivName: null,
          },
        ]);
      }),
    );

    expect(await fetchPopularItems(6)).toEqual([
      { rank: 1, npayCode: 'MX1220000', name: '도수치료' },
    ]);
    expect(limit).toBe('6');
  });

  it('실패하면 빈 배열이다', async () => {
    server.use(
      http.get(
        `${API}/api/npay-items/popular`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    expect(await fetchPopularItems(6)).toEqual([]);
  });
});
