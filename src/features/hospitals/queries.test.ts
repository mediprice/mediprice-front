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

const priceRow = (
  npayCode: string,
  hospitalItemName: string,
  price: number,
) => ({
  npayCode,
  itemName: '이학요법료/도수치료',
  categoryName: '이학요법료',
  hospitalItemName,
  price,
  startDate: '2026-09-03',
});

describe('hospitalQueries.priceList', () => {
  it('검색어·분류와 페이지를 평평한 쿼리로 보내고 다음 페이지를 이어 받는다', async () => {
    const urls: URL[] = [];
    server.use(
      http.get(`${BASE}/api/hospitals/H1/prices`, ({ request }) => {
        const url = new URL(request.url);
        urls.push(url);
        const page = Number(url.searchParams.get('page'));
        return HttpResponse.json({
          content: [priceRow('MX1220000', `p${page}`, 1000)],
          page,
          size: 20,
          totalElements: 21,
          totalPages: 2,
        });
      }),
    );
    const client = new QueryClient();
    const options = hospitalQueries.priceList('H1', {
      keyword: '도수',
      categoryCode: '1070Z',
    });

    const first = await client.fetchInfiniteQuery(options);
    const next = options.getNextPageParam(
      first.pages[0]!,
      first.pages,
      0,
      first.pageParams,
    );

    expect(next).toBe(1);
    expect(urls[0]?.searchParams.get('keyword')).toBe('도수');
    expect(urls[0]?.searchParams.get('categoryCode')).toBe('1070Z');
    expect(urls[0]?.searchParams.get('page')).toBe('0');
    expect(urls[0]?.searchParams.get('size')).toBe('20');
    expect(urls[0]?.searchParams.has('condition')).toBe(false);
  });

  it('마지막 페이지면 다음 페이지가 없다', () => {
    const options = hospitalQueries.priceList('H1', {});
    const last = {
      content: [],
      page: 1,
      size: 20,
      totalElements: 21,
      totalPages: 2,
    };

    expect(options.getNextPageParam(last, [last], 1, [1])).toBeUndefined();
  });
});

describe('hospitalQueries.itemPrices', () => {
  it('항목 이름으로 검색한 뒤 비급여 코드가 같은 세부 항목만 남긴다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/hospitals/H1/prices`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({
          content: [
            priceRow('MX1220000', '도수치료 20분', 50000),
            priceRow('MX1220099', '다른 항목', 1000),
            priceRow('MX1220000', '도수치료 40분', 100000),
          ],
          page: 0,
          size: 100,
          totalElements: 3,
          totalPages: 1,
        });
      }),
    );

    const rows = await new QueryClient().fetchQuery(
      hospitalQueries.itemPrices('H1', 'MX1220000', '이학요법료/도수치료'),
    );

    expect(rows.map((row) => row.hospitalItemName)).toEqual([
      '도수치료 20분',
      '도수치료 40분',
    ]);
    expect(url?.searchParams.get('keyword')).toBe('이학요법료/도수치료');
    expect(url?.searchParams.get('size')).toBe('100');
  });
});

describe('hospitalQueries.priceHistory', () => {
  it('비급여 코드를 평평한 쿼리로 보내 월별 추이를 가져온다', async () => {
    let url: URL | undefined;
    const history = { ykiho: 'H1', npayCode: 'MX1220000', series: [] };
    server.use(
      http.get(`${BASE}/api/hospitals/H1/prices/history`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(history);
      }),
    );

    const data = await new QueryClient().fetchQuery(
      hospitalQueries.priceHistory('H1', { npayCode: 'MX1220000' }),
    );

    expect(data).toEqual(history);
    expect(url?.searchParams.get('npayCode')).toBe('MX1220000');
  });

  it('없는 항목은 ApiError(NPAY_ITEM_NOT_FOUND)로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/hospitals/H1/prices/history`, () =>
        HttpResponse.json(
          { code: 'NPAY_ITEM_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    await expect(
      new QueryClient().fetchQuery(
        hospitalQueries.priceHistory('H1', { npayCode: 'ZZZ' }),
      ),
    ).rejects.toMatchObject({ status: 404, code: 'NPAY_ITEM_NOT_FOUND' });
  });
});

describe('hospitalKeys', () => {
  it('가격·추이 키는 병원 상세 키 아래에 있어 병원 단위로 무효화할 수 있다', () => {
    const detail = hospitalKeys.detail('H1');
    expect(hospitalKeys.priceList('H1', {}).slice(0, detail.length)).toEqual(
      detail,
    );
    expect(
      hospitalKeys
        .priceHistory('H1', { npayCode: 'MX1220000' })
        .slice(0, detail.length),
    ).toEqual(detail);
  });

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
