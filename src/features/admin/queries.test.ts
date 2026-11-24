import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { reviewKeys } from '@/features/reviews/queries';
import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import {
  adminKeys,
  adminMutations,
  adminQueries,
  type AdminReport,
} from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

function report(overrides: Partial<AdminReport> = {}): AdminReport {
  return {
    id: 7,
    reporterId: 3,
    reason: 'ABUSE',
    detail: null,
    status: 'PENDING',
    action: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: '2026-11-18T01:00:00Z',
    review: {
      id: 11,
      ykiho: 'H1',
      authorId: 5,
      rating: 1,
      content: '후기 본문',
      status: 'ACTIVE',
      createdAt: '2026-11-17T01:00:00Z',
    },
    ...overrides,
  };
}

function page(content: AdminReport[], totalElements = content.length) {
  return { content, page: 0, size: 20, totalElements, totalPages: 1 };
}

function errorBody(code: string, status: number) {
  return HttpResponse.json(
    { code, message: '백엔드 문구', errors: [] },
    { status },
  );
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('adminQueries.reports', () => {
  it('상태를 평평한 쿼리로 보내고 페이지를 0부터 센다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/admin/reports`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page([report()]));
      }),
    );

    const result = await newClient().fetchQuery(
      adminQueries.reports({ status: 'resolved', page: 2 }),
    );

    expect(result.content[0]?.id).toBe(7);
    expect(url?.searchParams.get('status')).toBe('RESOLVED');
    expect(url?.searchParams.get('page')).toBe('1');
    expect(url?.searchParams.get('size')).toBe('20');
  });

  it('전체를 고르면 상태를 보내지 않는다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/admin/reports`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page([]));
      }),
    );

    await newClient().fetchQuery(
      adminQueries.reports({ status: 'all', page: 1 }),
    );

    expect(url?.searchParams.has('status')).toBe(false);
  });

  it('운영자가 아니면(403) 코드가 담긴 ApiError로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/admin/reports`, () =>
        errorBody('ACCESS_DENIED', 403),
      ),
    );

    await expect(
      newClient().fetchQuery(
        adminQueries.reports({ status: 'pending', page: 1 }),
      ),
    ).rejects.toMatchObject({ status: 403, code: 'ACCESS_DENIED' });
  });
});

describe('adminQueries.pendingCount', () => {
  it('대기 중 신고를 한 건짜리 페이지로 물어 전체 개수만 돌려준다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/admin/reports`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page([report()], 42));
      }),
    );

    await expect(
      newClient().fetchQuery(adminQueries.pendingCount()),
    ).resolves.toBe(42);
    expect(url?.searchParams.get('status')).toBe('PENDING');
    expect(url?.searchParams.get('size')).toBe('1');
  });
});

describe('adminMutations.resolveReport', () => {
  function seededClient() {
    const client = newClient();
    client.setQueryData(
      adminKeys.reportList({ status: 'pending', page: 1 }),
      page([report()]),
    );
    client.setQueryData(adminKeys.pendingCount(), 1);
    client.setQueryData(adminKeys.batchStatus(), {
      available: true,
      jobs: [],
    });
    client.setQueryData(reviewKeys.hospital('H1', 'latest'), {
      pages: [],
      pageParams: [],
    });
    return client;
  }

  function isStale(client: QueryClient, key: readonly unknown[]) {
    return client.getQueryState(key)?.isInvalidated === true;
  }

  it('처리 방법을 보내고, 성공하면 신고 목록·개수와 후기 캐시를 무효화한다', async () => {
    let body: unknown;
    let path = '';
    server.use(
      http.patch(`${BASE}/api/admin/reports/:id`, async ({ request }) => {
        body = await request.json();
        path = new URL(request.url).pathname;
        return HttpResponse.json(
          report({ status: 'RESOLVED', action: 'HIDE_REVIEW' }),
        );
      }),
    );
    const client = seededClient();

    const resolved = await new MutationObserver(
      client,
      adminMutations.resolveReport(client),
    ).mutate({ reportId: 7, action: 'HIDE_REVIEW' });

    expect(resolved.action).toBe('HIDE_REVIEW');
    expect(path).toBe('/bff/api/admin/reports/7');
    expect(body).toEqual({ action: 'HIDE_REVIEW' });
    expect(
      isStale(client, adminKeys.reportList({ status: 'pending', page: 1 })),
    ).toBe(true);
    expect(isStale(client, adminKeys.pendingCount())).toBe(true);
    expect(isStale(client, reviewKeys.hospital('H1', 'latest'))).toBe(true);
    expect(isStale(client, adminKeys.batchStatus())).toBe(false);
  });

  it('다른 운영자가 먼저 처리했으면(409) 실패를 알리고 낡은 목록을 다시 받는다', async () => {
    server.use(
      http.patch(`${BASE}/api/admin/reports/:id`, () =>
        errorBody('REPORT_ALREADY_RESOLVED', 409),
      ),
    );
    const client = seededClient();

    const error = await new MutationObserver(
      client,
      adminMutations.resolveReport(client),
    )
      .mutate({ reportId: 7, action: 'DISMISS' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'REPORT_ALREADY_RESOLVED' });
    expect(
      isStale(client, adminKeys.reportList({ status: 'pending', page: 1 })),
    ).toBe(true);
    expect(isStale(client, adminKeys.pendingCount())).toBe(true);
  });

  it('권한·서버 오류는 목록을 건드리지 않는다', async () => {
    server.use(
      http.patch(`${BASE}/api/admin/reports/:id`, () =>
        errorBody('ACCESS_DENIED', 403),
      ),
    );
    const client = seededClient();

    await new MutationObserver(client, adminMutations.resolveReport(client))
      .mutate({ reportId: 7, action: 'DISMISS' })
      .catch(() => undefined);

    expect(
      isStale(client, adminKeys.reportList({ status: 'pending', page: 1 })),
    ).toBe(false);
  });
});
