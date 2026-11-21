import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { CLAIM_PRIVACY_NOTICE_VERSION } from '@/config/legal';
import { reviewKeys } from '@/features/reviews/queries';
import type * as PathsModule from '@/lib/api/paths';
import { server } from '@/test/server';

import {
  claimKeys,
  claimMutations,
  claimNoticeState,
  claimQueries,
} from './queries';

vi.mock('@/lib/api/paths', async (importOriginal) => {
  const actual = await importOriginal<typeof PathsModule>();
  return { ...actual, BFF_BASE: 'http://app.test/bff' };
});

const BASE = 'http://app.test/bff';
const NOTICE = `${BASE}/api/claims/privacy-notice`;
const CLAIMS = `${BASE}/api/reviews/11/claims`;
const OBJECTION = `${CLAIMS}/objection`;

const form = {
  reason: 'PRIVACY' as const,
  description: '제 전화번호가 적혀 있어요.',
  claimantRole: 'SELF' as const,
  claimantName: '홍길동',
  claimantEmail: 'claim@example.com',
  agreement: true,
};

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

describe('claimNoticeState', () => {
  it('서버에 기능이 없으면 unsupported, 접수 중단·버전 불일치면 closed다', () => {
    expect(claimNoticeState(null)).toBe('unsupported');
    expect(
      claimNoticeState({ available: false, privacyNoticeVersion: null }),
    ).toBe('closed');
    expect(
      claimNoticeState({ available: true, privacyNoticeVersion: '2000-01-01' }),
    ).toBe('closed');
    expect(
      claimNoticeState({
        available: true,
        privacyNoticeVersion: CLAIM_PRIVACY_NOTICE_VERSION,
      }),
    ).toBe('open');
  });
});

describe('claimQueries.notice', () => {
  it('접수 가능 여부와 안내문 버전을 돌려준다', async () => {
    const notice = { available: true, privacyNoticeVersion: '2026-11-19' };
    server.use(http.get(NOTICE, () => HttpResponse.json(notice)));

    await expect(
      newClient().fetchQuery(claimQueries.notice()),
    ).resolves.toEqual(notice);
  });

  it.each([
    [404, 'RESOURCE_NOT_FOUND'],
    [401, 'UNAUTHORIZED'],
  ])('배포된 백엔드에 경로가 없으면(%i %s) null이다', async (status, code) => {
    server.use(
      http.get(NOTICE, () => error(status, code)),
      http.post(`${BASE}/session/refresh`, () => error(401, 'UNAUTHORIZED')),
    );

    await expect(
      newClient().fetchQuery(claimQueries.notice()),
    ).resolves.toBeNull();
  });

  it('장애와 모양이 다른 응답은 그대로 던진다', async () => {
    server.use(http.get(NOTICE, () => error(503, 'UPSTREAM_UNAVAILABLE')));
    await expect(
      newClient().fetchQuery(claimQueries.notice()),
    ).rejects.toMatchObject({ status: 503 });

    server.use(http.get(NOTICE, () => HttpResponse.json({ available: 'yes' })));
    await expect(
      newClient().fetchQuery(claimQueries.notice()),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});

describe('claimMutations.submit', () => {
  it('프론트 안내문 버전과 동의를 담아 보내고, 후기 목록을 다시 받게 한다', async () => {
    const client = newClient();
    client.setQueryData(reviewKeys.hospital('H1', 'latest'), { pages: [] });
    let body: unknown;
    server.use(
      http.post(CLAIMS, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { id: 3, temporaryUntil: '2026-12-19T03:00:00.5Z' },
          { status: 201 },
        );
      }),
    );

    const receipt = await new MutationObserver(
      client,
      claimMutations.submit(client, 11),
    ).mutate(form);

    expect(receipt).toEqual({
      id: 3,
      temporaryUntil: '2026-12-19T03:00:00.5Z',
    });
    expect(body).toEqual({
      claimantName: '홍길동',
      claimantEmail: 'claim@example.com',
      claimantRole: 'SELF',
      reason: 'PRIVACY',
      description: '제 전화번호가 적혀 있어요.',
      agreement: true,
      privacyNoticeVersion: CLAIM_PRIVACY_NOTICE_VERSION,
    });
    expect(isStale(client, reviewKeys.hospital('H1', 'latest'))).toBe(true);
  });

  it.each([
    ['CLAIM_NOTICE_VERSION_OUTDATED', 409],
    ['CLAIM_UNAVAILABLE', 503],
  ])('%s면 안내 상태를 다시 받는다', async (code, status) => {
    const client = newClient();
    client.setQueryData(claimKeys.notice(), {
      available: true,
      privacyNoticeVersion: CLAIM_PRIVACY_NOTICE_VERSION,
    });
    server.use(http.post(CLAIMS, () => error(status, code)));

    const caught = await new MutationObserver(
      client,
      claimMutations.submit(client, 11),
    )
      .mutate(form)
      .catch((reason: unknown) => reason);

    expect(caught).toMatchObject({ status, code });
    expect(isStale(client, claimKeys.notice())).toBe(true);
  });

  it('한도 초과(429)는 안내 상태를 건드리지 않는다', async () => {
    const client = newClient();
    client.setQueryData(claimKeys.notice(), {
      available: true,
      privacyNoticeVersion: CLAIM_PRIVACY_NOTICE_VERSION,
    });
    server.use(http.post(CLAIMS, () => error(429, 'CLAIM_RATE_LIMITED')));

    await new MutationObserver(client, claimMutations.submit(client, 11))
      .mutate(form)
      .catch(() => undefined);

    expect(isStale(client, claimKeys.notice())).toBe(false);
  });
});

describe('claimMutations.object', () => {
  it('재게시 요청을 { content }로 보내고(204) 내 후기를 다시 받게 한다', async () => {
    const client = newClient();
    client.setQueryData(reviewKeys.myList(), { pages: [] });
    let body: unknown;
    server.use(
      http.post(OBJECTION, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await new MutationObserver(
      client,
      claimMutations.object(client, 11),
    ).mutate({ content: '직접 겪은 일이에요.' });

    expect(body).toEqual({ content: '직접 겪은 일이에요.' });
    expect(isStale(client, reviewKeys.myList())).toBe(true);
  });

  it.each([
    ['ACTIVE_CLAIM_NOT_FOUND', 404, true],
    ['CLAIM_OBJECTION_ALREADY_SUBMITTED', 409, true],
    ['CLAIM_OBJECTION_FORBIDDEN', 403, false],
  ])('%s(%i)면 내 후기 목록을 다시 받는지: %s', async (code, status, stale) => {
    const client = newClient();
    client.setQueryData(reviewKeys.myList(), { pages: [] });
    server.use(http.post(OBJECTION, () => error(status, code)));

    const caught = await new MutationObserver(
      client,
      claimMutations.object(client, 11),
    )
      .mutate({ content: '이유' })
      .catch((reason: unknown) => reason);

    expect(caught).toMatchObject({ status, code });
    expect(isStale(client, reviewKeys.myList())).toBe(stale);
  });
});
