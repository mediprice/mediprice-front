import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { comparisonKeys, comparisonQueries } from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';
const table = { hospitals: [], items: [], truncated: false };

describe('comparisonQueries.table', () => {
  it('병원과 항목을 쉼표로 이은 평평한 쿼리로 보낸다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/comparisons`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(table);
      }),
    );

    const data = await new QueryClient().fetchQuery(
      comparisonQueries.table(['A', 'B'], ['MX1220000']),
    );

    expect(data).toEqual(table);
    expect(url?.searchParams.get('ykihos')).toBe('A,B');
    expect(url?.searchParams.get('npayCodes')).toBe('MX1220000');
    expect(url?.searchParams.has('condition')).toBe(false);
  });

  it('항목이 없으면 npayCodes를 보내지 않는다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/comparisons`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(table);
      }),
    );

    await new QueryClient().fetchQuery(comparisonQueries.table(['A', 'B']));

    expect(url?.searchParams.get('ykihos')).toBe('A,B');
    expect(url?.searchParams.has('npayCodes')).toBe(false);
  });

  it('없는 병원은 HOSPITAL_NOT_FOUND ApiError다', async () => {
    server.use(
      http.get(`${BASE}/api/comparisons`, () =>
        HttpResponse.json(
          { code: 'HOSPITAL_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );

    const promise = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }).fetchQuery(comparisonQueries.table(['A', 'X']));

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      code: 'HOSPITAL_NOT_FOUND',
    });
  });

  it('병원 순서가 다르면 다른 키다', () => {
    expect(comparisonKeys.table(['A', 'B'], [])).not.toEqual(
      comparisonKeys.table(['B', 'A'], []),
    );
  });
});
