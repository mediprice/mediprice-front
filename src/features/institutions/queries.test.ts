import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { institutionKeys, institutionQueries } from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

describe('institutionQueries', () => {
  it('요양기관 종별 목록을 가져온다', async () => {
    const types = [
      { code: '11', name: '종합병원' },
      { code: '21', name: '병원' },
    ];
    server.use(
      http.get(`${BASE}/api/institution-types`, () => HttpResponse.json(types)),
    );

    const data = await new QueryClient().fetchQuery(institutionQueries.types());

    expect(data).toEqual(types);
  });

  it('서버 오류는 ApiError로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/institution-types`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: '오류', errors: [] },
          { status: 500 },
        ),
      ),
    );

    const promise = new QueryClient().fetchQuery(institutionQueries.types());

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  });

  it('키는 도메인에서 항목으로 좁혀지는 계층이다', () => {
    expect(institutionKeys.types().slice(0, 1)).toEqual(institutionKeys.all);
  });
});
