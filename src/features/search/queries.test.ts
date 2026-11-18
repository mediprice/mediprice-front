import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { searchKeys, searchQueries, totalCount } from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

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

function page<T>(content: T[], pageIndex: number, totalElements: number) {
  return {
    content,
    page: pageIndex,
    size: 20,
    totalElements,
    totalPages: Math.ceil(totalElements / 20),
  };
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
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/npay-items`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page([item('MX1220000')], 0, 1));
      }),
    );

    const data = await new QueryClient().fetchInfiniteQuery(
      searchQueries.items({ keyword: '도수' }),
    );

    expect(url?.searchParams.get('keyword')).toBe('도수');
    expect(url?.searchParams.has('categoryCode')).toBe(false);
    expect(url?.searchParams.get('page')).toBe('0');
    expect(url?.searchParams.get('size')).toBe('20');
    expect(data.pages[0]?.content.map(({ code }) => code)).toEqual([
      'MX1220000',
    ]);
    expect(totalCount(data.pages)).toBe(1);
  });

  it('분류 코드가 여럿이면 전체 개수를 합치고 코드 순서대로 이어서 불러온다', async () => {
    serveItems({ '1100Z': 25, '1180Z': 3 });
    const queryClient = new QueryClient();
    const options = searchQueries.items({ categoryCodes: ['1100Z', '1180Z'] });

    const data = await queryClient.fetchInfiniteQuery({ ...options, pages: 3 });

    expect(totalCount(data.pages)).toBe(28);
    expect(data.pages.map((p) => p.content.length)).toEqual([20, 5, 3]);
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
    const options = searchQueries.items({
      categoryCodes: ['1032A', '1032B', '1025A', '1025B'],
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
      searchQueries.items({ categoryCodes: ['1100Z', '1180Z'] }),
    );

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
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
        return HttpResponse.json(page([hospital], 0, 1));
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
    const key = searchKeys.items({ keyword: '도수' });
    expect(key.slice(0, searchKeys.all.length)).toEqual(searchKeys.all);
    expect(key).not.toEqual(searchKeys.items({ keyword: '라식' }));
    expect(
      searchKeys.hospitals({ keyword: '도수', sidoCodes: [] }),
    ).not.toEqual(key);
  });
});
