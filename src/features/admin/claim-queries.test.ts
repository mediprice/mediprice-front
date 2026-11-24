import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { reviewKeys } from '@/features/reviews/queries';
import type * as PathsModule from '@/lib/api/paths';
import { server } from '@/test/server';

import type { AdminClaim } from './claim-api';
import { adminClaimMutations, adminClaimQueries } from './claim-queries';
import { adminKeys } from './queries';

vi.mock('@/lib/api/paths', async (importOriginal) => {
  const actual = await importOriginal<typeof PathsModule>();
  return { ...actual, BFF_BASE: 'http://app.test/bff' };
});

const BASE = 'http://app.test/bff';

function claim(overrides: Partial<AdminClaim> = {}): AdminClaim {
  return {
    id: 5,
    reviewId: 11,
    claimantUserId: null,
    claimantName: '홍길동',
    claimantEmail: 'claim@example.com',
    claimantRole: 'HOSPITAL',
    reason: 'DEFAMATION',
    description: '사실이 아니에요.',
    privacyNoticeVersion: '2026-11-19',
    status: 'PENDING',
    temporaryUntil: '2026-12-19T03:00:00.123Z',
    objection: null,
    objectedAt: null,
    action: null,
    resolutionNote: null,
    resolvedBy: null,
    resolvedAt: null,
    claimantNotifiedAt: null,
    authorNotifiedAt: null,
    createdAt: '2026-11-19T03:00:00.123Z',
    review: {
      id: 11,
      ykiho: 'H1',
      authorId: 9,
      rating: 1,
      content: '후기 본문',
      status: 'TEMPORARILY_HIDDEN',
      createdAt: '2026-11-01T01:00:00Z',
    },
    ...overrides,
  };
}

function page(content: AdminClaim[], totalElements = content.length) {
  return { content, page: 0, size: 20, totalElements, totalPages: 1 };
}

const error = (status: number, code: string) =>
  HttpResponse.json({ code, message: '백엔드 문구', errors: [] }, { status });

function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
}

function isStale(client: QueryClient, queryKey: readonly unknown[]) {
  return client.getQueryState(queryKey)?.isInvalidated ?? false;
}

describe('adminClaimQueries.list', () => {
  it('상태·페이지(0부터)·크기를 평평한 쿼리로 보낸다', async () => {
    let search = '';
    server.use(
      http.get(`${BASE}/api/admin/claims`, ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json(page([claim()]));
      }),
    );

    const result = await newClient().fetchQuery(
      adminClaimQueries.list({ status: 'expired', page: 3 }),
    );

    expect(search).toBe('?status=EXPIRED_PENDING&page=2&size=20');
    expect(result.content[0]?.claimantEmail).toBe('claim@example.com');
  });

  it('모양이 다른 응답은 INVALID_RESPONSE로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/admin/claims`, () =>
        HttpResponse.json(page([{ ...claim(), status: 'OPEN' } as never])),
      ),
    );

    await expect(
      newClient().fetchQuery(
        adminClaimQueries.list({ status: 'pending', page: 1 }),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});

describe('adminClaimQueries.count', () => {
  it('한 건짜리 페이지의 totalElements를 쓴다', async () => {
    let search = '';
    server.use(
      http.get(`${BASE}/api/admin/claims`, ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json(page([claim()], 4));
      }),
    );

    await expect(
      newClient().fetchQuery(adminClaimQueries.count('EXPIRED_PENDING')),
    ).resolves.toBe(4);
    expect(search).toBe('?status=EXPIRED_PENDING&page=0&size=1');
  });

  it('서버에 기능이 없으면 null, 권한 오류는 그대로 던진다', async () => {
    server.use(
      http.get(`${BASE}/api/admin/claims`, () =>
        error(404, 'RESOURCE_NOT_FOUND'),
      ),
    );
    await expect(
      newClient().fetchQuery(adminClaimQueries.count('PENDING')),
    ).resolves.toBeNull();

    server.use(
      http.get(`${BASE}/api/admin/claims`, () => error(403, 'ACCESS_DENIED')),
    );
    await expect(
      newClient().fetchQuery(adminClaimQueries.count('PENDING')),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('adminClaimMutations', () => {
  it('처리하면 사유와 알린 대상을 PATCH로 보내고 목록·후기를 다시 받게 한다', async () => {
    const client = newClient();
    client.setQueryData(
      adminKeys.claimList({ status: 'pending', page: 1 }),
      page([claim()]),
    );
    client.setQueryData(reviewKeys.hospital('H1', 'latest'), { pages: [] });
    let body: unknown;
    server.use(
      http.patch(`${BASE}/api/admin/claims/5`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          claim({
            status: 'RESOLVED',
            action: 'DELETE_REVIEW',
            resolutionNote: '사실 확인',
            claimantNotifiedAt: '2026-11-20T01:00:00Z',
          }),
        );
      }),
    );

    const resolved = await new MutationObserver(
      client,
      adminClaimMutations.resolve(client),
    ).mutate({
      claimId: 5,
      action: 'DELETE_REVIEW',
      note: '사실 확인',
      claimantNotified: true,
    });

    expect(body).toEqual({
      action: 'DELETE_REVIEW',
      note: '사실 확인',
      claimantNotified: true,
    });
    expect(resolved.status).toBe('RESOLVED');
    expect(client.getQueryData(adminKeys.claimDetail(5))).toEqual(resolved);
    expect(
      isStale(client, adminKeys.claimList({ status: 'pending', page: 1 })),
    ).toBe(true);
    expect(isStale(client, reviewKeys.hospital('H1', 'latest'))).toBe(true);
  });

  it('다른 운영자가 먼저 처리했으면(409) 목록을 다시 받게 한다', async () => {
    const client = newClient();
    client.setQueryData(
      adminKeys.claimList({ status: 'pending', page: 1 }),
      page([claim()]),
    );
    server.use(
      http.patch(`${BASE}/api/admin/claims/5`, () =>
        error(409, 'CLAIM_ALREADY_RESOLVED'),
      ),
    );

    const caught = await new MutationObserver(
      client,
      adminClaimMutations.resolve(client),
    )
      .mutate({ claimId: 5, action: 'RESTORE', note: '문제 없음' })
      .catch((reason: unknown) => reason);

    expect(caught).toMatchObject({ code: 'CLAIM_ALREADY_RESOLVED' });
    expect(
      isStale(client, adminKeys.claimList({ status: 'pending', page: 1 })),
    ).toBe(true);
  });

  it('알림 기록은 /notifications에 고른 쪽만 true로 보낸다', async () => {
    const client = newClient();
    let body: unknown;
    server.use(
      http.patch(
        `${BASE}/api/admin/claims/5/notifications`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(
            claim({
              status: 'RESOLVED',
              action: 'RESTORE',
              authorNotifiedAt: '2026-11-20T01:00:00Z',
            }),
          );
        },
      ),
    );

    const updated = await new MutationObserver(
      client,
      adminClaimMutations.markNotified(client),
    ).mutate({ claimId: 5, authorNotified: true });

    expect(body).toEqual({ authorNotified: true });
    expect(updated.authorNotifiedAt).toBe('2026-11-20T01:00:00Z');
    expect(client.getQueryData(adminKeys.claimDetail(5))).toEqual(updated);
  });
});
