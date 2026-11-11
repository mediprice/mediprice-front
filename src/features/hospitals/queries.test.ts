import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { server } from '@/test/server';

import { hospitalKeys, hospitalQueries } from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

describe('hospitalQueries.search', () => {
  it('검색 조건과 페이지를 평평한 쿼리 문자열로 보낸다', async () => {
    let url: URL | undefined;
    const page = {
      content: [],
      page: 0,
      size: 5,
      totalElements: 0,
      totalPages: 0,
    };
    server.use(
      http.get(`${BASE}/api/hospitals`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page);
      }),
    );

    const data = await new QueryClient().fetchQuery(
      hospitalQueries.search({
        condition: { keyword: '삼성', sidoCode: '110000' },
        pageQuery: { page: 0, size: 5 },
      }),
    );

    expect(data).toEqual(page);
    expect(url?.searchParams.get('keyword')).toBe('삼성');
    expect(url?.searchParams.get('sidoCode')).toBe('110000');
    expect(url?.searchParams.get('page')).toBe('0');
    expect(url?.searchParams.get('size')).toBe('5');
    expect(url?.searchParams.has('condition')).toBe(false);
  });

  it('입력 검증 실패는 필드 에러를 담은 ApiError다', async () => {
    server.use(
      http.get(`${BASE}/api/hospitals`, () =>
        HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '잘못된 요청입니다.',
            errors: [{ field: 'keyword', reason: '공백일 수 없습니다' }],
          },
          { status: 400 },
        ),
      ),
    );

    const promise = new QueryClient().fetchQuery(
      hospitalQueries.search({ condition: { keyword: ' ' }, pageQuery: {} }),
    );

    await expect(promise).rejects.toMatchObject({
      status: 400,
      fieldErrors: [{ field: 'keyword', reason: '공백일 수 없습니다' }],
    });
  });
});

describe('hospitalQueries.detail', () => {
  it('병원 상세를 가져온다', async () => {
    server.use(
      http.get(`${BASE}/api/hospitals/H1`, () =>
        HttpResponse.json({ ykiho: 'H1' }),
      ),
    );

    const data = await new QueryClient().fetchQuery(
      hospitalQueries.detail('H1'),
    );

    expect(data).toMatchObject({ ykiho: 'H1' });
  });

  it('특수문자가 있는 ykiho는 경로에 인코딩해서 보낸다', async () => {
    let pathname = '';
    server.use(
      http.get(`${BASE}/api/hospitals/:ykiho`, ({ request }) => {
        pathname = new URL(request.url).pathname;
        return HttpResponse.json({ ykiho: 'x' });
      }),
    );

    await new QueryClient().fetchQuery(hospitalQueries.detail('a+b=/c'));

    expect(pathname).toBe('/bff/api/hospitals/a%2Bb%3D%2Fc');
  });

  it('없는 병원은 ApiError(HOSPITAL_NOT_FOUND)로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/hospitals/NOPE`, () =>
        HttpResponse.json(
          { code: 'HOSPITAL_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    await expect(
      new QueryClient().fetchQuery(hospitalQueries.detail('NOPE')),
    ).rejects.toMatchObject({ status: 404, code: 'HOSPITAL_NOT_FOUND' });
  });
});

describe('hospitalKeys', () => {
  it('상세·목록 키는 hospitals 아래에 있어 한 번에 무효화할 수 있다', () => {
    expect(hospitalKeys.detail('H1').slice(0, 1)).toEqual(hospitalKeys.all);
    expect(
      hospitalKeys
        .list({ condition: { keyword: 'a' }, pageQuery: {} })
        .slice(0, 1),
    ).toEqual(hospitalKeys.all);
  });

  it('조건이 다르면 목록 키도 다르다', () => {
    expect(
      hospitalKeys.list({ condition: { keyword: 'a' }, pageQuery: {} }),
    ).not.toEqual(
      hospitalKeys.list({ condition: { keyword: 'b' }, pageQuery: {} }),
    );
  });
});
