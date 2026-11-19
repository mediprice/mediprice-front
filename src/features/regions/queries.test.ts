import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { regionKeys, regionQueries } from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

describe('regionQueries', () => {
  it('시도 목록을 가져온다', async () => {
    const sido = [{ code: '110000', name: '서울' }];
    server.use(
      http.get(`${BASE}/api/regions/sido`, () => HttpResponse.json(sido)),
    );

    const data = await new QueryClient().fetchQuery(regionQueries.sido());

    expect(data).toEqual(sido);
  });

  it('시군구 목록은 시도 코드로 가져온다', async () => {
    const sggu = [{ code: '110001', name: '종로구', sidoCode: '110000' }];
    server.use(
      http.get(`${BASE}/api/regions/sido/110000/sggu`, () =>
        HttpResponse.json(sggu),
      ),
    );

    const data = await new QueryClient().fetchQuery(
      regionQueries.sggu('110000'),
    );

    expect(data).toEqual(sggu);
  });

  it('없는 시도는 ApiError(SIDO_NOT_FOUND)로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/regions/sido/999999/sggu`, () =>
        HttpResponse.json(
          { code: 'SIDO_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    const promise = new QueryClient().fetchQuery(regionQueries.sggu('999999'));

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      code: 'SIDO_NOT_FOUND',
    });
  });

  it('키는 도메인에서 항목으로 좁혀지는 계층이다', () => {
    expect(regionKeys.sggu('110000').slice(0, regionKeys.all.length)).toEqual(
      regionKeys.all,
    );
    expect(regionKeys.sido()).not.toEqual(regionKeys.sggu('110000'));
  });
});
