import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { server } from '@/test/server';

import { reviewKeys, reviewQueries } from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

const emptyPage = (page: number, totalPages: number) => ({
  content: [],
  page,
  size: 5,
  totalElements: totalPages * 5,
  totalPages,
});

describe('reviewQueries.hospital', () => {
  it('정렬과 페이지를 평평한 쿼리로 보낸다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/hospitals/H1/reviews`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(emptyPage(0, 1));
      }),
    );

    await new QueryClient().fetchInfiniteQuery(reviewQueries.hospital('H1'));

    expect(url?.searchParams.get('sort')).toBe('latest');
    expect(url?.searchParams.get('page')).toBe('0');
    expect(url?.searchParams.get('size')).toBe('5');
    expect(url?.searchParams.has('sortCondition')).toBe(false);
  });

  it('남은 페이지가 있을 때만 다음 페이지 번호를 준다', () => {
    const options = reviewQueries.hospital('H1');
    const first = emptyPage(0, 2);
    const last = emptyPage(1, 2);

    expect(options.getNextPageParam(first, [first], 0, [0])).toBe(1);
    expect(
      options.getNextPageParam(last, [first, last], 1, [0, 1]),
    ).toBeUndefined();
  });

  it('백엔드 장애는 ApiError로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/hospitals/H1/reviews`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '오류', errors: [] },
          { status: 500 },
        ),
      ),
    );

    await expect(
      new QueryClient().fetchInfiniteQuery(reviewQueries.hospital('H1')),
    ).rejects.toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });

  it('5xx는 한 번만 다시 보내고 4xx는 다시 보내지 않는다', async () => {
    let serverErrorCalls = 0;
    let notFoundCalls = 0;
    server.use(
      http.get(`${BASE}/api/hospitals/H1/reviews`, () => {
        serverErrorCalls += 1;
        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '오류', errors: [] },
          { status: 500 },
        );
      }),
      http.get(`${BASE}/api/hospitals/NOPE/reviews`, () => {
        notFoundCalls += 1;
        return HttpResponse.json(
          { code: 'HOSPITAL_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        );
      }),
    );
    const client = new QueryClient();
    const retryFast = { retryDelay: 0 };

    await expect(
      client.fetchInfiniteQuery({
        ...reviewQueries.hospital('H1'),
        ...retryFast,
      }),
    ).rejects.toMatchObject({ status: 500 });
    await expect(
      client.fetchInfiniteQuery({
        ...reviewQueries.hospital('NOPE'),
        ...retryFast,
      }),
    ).rejects.toMatchObject({ status: 404 });

    expect(serverErrorCalls).toBe(2);
    expect(notFoundCalls).toBe(1);
  });

  it('정렬이 다르면 키가 달라 따로 캐시된다', () => {
    expect(reviewKeys.hospital('H1', 'latest')).not.toEqual(
      reviewKeys.hospital('H1', 'rating'),
    );
  });
});

describe('reviewQueries.mine', () => {
  it('5xx는 한 번만 다시 보내고 실패를 알린다', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/api/users/me/reviews`, () => {
        calls += 1;
        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '오류', errors: [] },
          { status: 500 },
        );
      }),
    );

    await expect(
      new QueryClient().fetchInfiniteQuery({
        ...reviewQueries.mine(),
        retryDelay: 0,
      }),
    ).rejects.toMatchObject({ status: 500 });
    expect(calls).toBe(2);
  });
});
