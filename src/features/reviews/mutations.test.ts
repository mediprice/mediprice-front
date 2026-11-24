import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { server } from '@/test/server';

import {
  type Review,
  reviewKeys,
  reviewMutations,
  reviewQueries,
} from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';
const NO_VISIT = { visitedOn: undefined, paidAmount: undefined };

function review(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    ykiho: 'H1',
    hospitalName: '튼튼병원',
    authorName: '건*하루',
    mine: true,
    rating: 4,
    content: '설명을 자세히 해 주셔서 좋았어요.',
    npayCode: null,
    paidAmount: null,
    visitedOn: null,
    status: 'ACTIVE',
    createdAt: '2026-10-02T01:00:00Z',
    updatedAt: '2026-10-02T01:00:00Z',
    ...overrides,
  };
}

function errorBody(
  code: string,
  status: number,
  errors: { field: string; reason: string }[] = [],
) {
  return HttpResponse.json(
    { code, message: '백엔드 문구', errors },
    { status },
  );
}

function page(content: Review[], pageNumber: number, totalPages: number) {
  return {
    content,
    page: pageNumber,
    size: 100,
    totalElements: content.length,
    totalPages,
  };
}

/** 후기 캐시가 무효화되는지 보려고 병원 목록과 내 후기 목록 캐시를 미리 채운다. */
function seededClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(reviewKeys.hospital('H1', 'latest'), {
    pages: [],
    pageParams: [],
  });
  client.setQueryData(reviewKeys.myList(), { pages: [], pageParams: [] });
  return client;
}

function isStale(client: QueryClient, key: readonly unknown[]) {
  return client.getQueryState(key)?.isInvalidated === true;
}

describe('reviewMutations.create', () => {
  it('비운 선택 칸은 빼고 보내고, 성공하면 병원 목록과 내 후기 캐시를 무효화한다', async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/hospitals/H1/reviews`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(review(), { status: 201 });
      }),
    );
    const client = seededClient();

    const created = await new MutationObserver(
      client,
      reviewMutations.create(client, 'H1'),
    ).mutate({
      rating: 4,
      content: '설명을 자세히 해 주셔서 좋았어요.',
      ...NO_VISIT,
    });

    expect(created.id).toBe(1);
    expect(body).toEqual({
      rating: 4,
      content: '설명을 자세히 해 주셔서 좋았어요.',
    });
    expect(isStale(client, reviewKeys.hospital('H1', 'latest'))).toBe(true);
    expect(isStale(client, reviewKeys.myList())).toBe(true);
  });

  it('방문일과 결제 금액을 넣으면 함께 보낸다', async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/api/hospitals/H1/reviews`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(review(), { status: 201 });
      }),
    );
    const client = seededClient();

    await new MutationObserver(
      client,
      reviewMutations.create(client, 'H1'),
    ).mutate({
      rating: 5,
      content: '도수치료 설명이 자세했어요.',
      visitedOn: '2026-10-01',
      paidAmount: 0,
    });

    expect(body).toEqual({
      rating: 5,
      content: '도수치료 설명이 자세했어요.',
      visitedOn: '2026-10-01',
      paidAmount: 0,
    });
  });

  it('입력 검증 실패는 fieldErrors를 담은 ApiError로 실패하고 캐시는 그대로 둔다', async () => {
    server.use(
      http.post(`${BASE}/api/hospitals/H1/reviews`, () =>
        errorBody('INVALID_INPUT', 400, [
          { field: 'content', reason: '공백일 수 없습니다' },
        ]),
      ),
    );
    const client = seededClient();

    await expect(
      new MutationObserver(client, reviewMutations.create(client, 'H1')).mutate(
        { rating: 4, content: '열 글자가 넘는 후기 내용', ...NO_VISIT },
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_INPUT',
      fieldErrors: [{ field: 'content', reason: '공백일 수 없습니다' }],
    });
    expect(isStale(client, reviewKeys.myList())).toBe(false);
  });
});

describe('reviewMutations.update', () => {
  it('PATCH로 보내고 받은 후기로 수정 화면 캐시를 바꾼다', async () => {
    let method: string | undefined;
    server.use(
      http.patch(`${BASE}/api/reviews/7`, ({ request }) => {
        method = request.method;
        return HttpResponse.json(review({ id: 7, rating: 2 }));
      }),
    );
    const client = seededClient();

    await new MutationObserver(
      client,
      reviewMutations.update(client, 7),
    ).mutate({
      rating: 2,
      content: '대기 시간이 길었어요. 다시 가진 않을래요.',
      ...NO_VISIT,
    });

    expect(method).toBe('PATCH');
    expect(client.getQueryData<Review>(reviewKeys.myReview(7))?.rating).toBe(2);
    expect(isStale(client, reviewKeys.myList())).toBe(true);
  });

  it('남의 후기(403 REVIEW_FORBIDDEN)면 실패하고 낡은 목록을 다시 받게 한다', async () => {
    server.use(
      http.patch(`${BASE}/api/reviews/7`, () =>
        errorBody('REVIEW_FORBIDDEN', 403),
      ),
    );
    const client = seededClient();

    await expect(
      new MutationObserver(client, reviewMutations.update(client, 7)).mutate({
        rating: 3,
        content: '열 글자가 넘는 후기 내용',
        ...NO_VISIT,
      }),
    ).rejects.toMatchObject({ status: 403, code: 'REVIEW_FORBIDDEN' });
    expect(isStale(client, reviewKeys.hospital('H1', 'latest'))).toBe(true);
  });

  it('화면이 mutate에 onError를 넘겨도 낡은 목록을 다시 받게 한다', async () => {
    server.use(
      http.patch(`${BASE}/api/reviews/7`, () =>
        errorBody('REVIEW_NOT_FOUND', 404),
      ),
    );
    const client = seededClient();
    const onError = vi.fn();
    const observer = new MutationObserver(
      client,
      reviewMutations.update(client, 7),
    );
    /** mutate에 넘긴 콜백은 구독 중인 화면(useMutation)에만 불린다. */
    const unsubscribe = observer.subscribe(() => {});

    await expect(
      observer.mutate(
        { rating: 3, content: '열 글자가 넘는 후기 내용', ...NO_VISIT },
        { onError },
      ),
    ).rejects.toMatchObject({ code: 'REVIEW_NOT_FOUND' });
    unsubscribe();
    expect(onError).toHaveBeenCalledOnce();
    expect(isStale(client, reviewKeys.hospital('H1', 'latest'))).toBe(true);
  });
});

describe('reviewMutations.remove', () => {
  it('지우면 수정 화면 캐시를 없애고 목록을 무효화한다', async () => {
    server.use(
      http.delete(
        `${BASE}/api/reviews/7`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const client = seededClient();
    client.setQueryData(reviewKeys.myReview(7), review({ id: 7 }));

    await new MutationObserver(client, reviewMutations.remove(client)).mutate(
      7,
    );

    expect(client.getQueryData(reviewKeys.myReview(7))).toBeUndefined();
    expect(isStale(client, reviewKeys.myList())).toBe(true);
  });

  it('이미 지워졌거나 숨겨진 후기(404)는 실패로 알리고 목록을 다시 받게 한다', async () => {
    server.use(
      http.delete(`${BASE}/api/reviews/7`, () =>
        errorBody('REVIEW_NOT_FOUND', 404),
      ),
    );
    const client = seededClient();

    await expect(
      new MutationObserver(client, reviewMutations.remove(client)).mutate(7),
    ).rejects.toMatchObject({ status: 404, code: 'REVIEW_NOT_FOUND' });
    expect(isStale(client, reviewKeys.myList())).toBe(true);
  });
});

describe('reviewMutations.report', () => {
  it('설명이 비었으면 사유만 보낸다', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${BASE}/api/reviews/3/reports`, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const client = new QueryClient();
    const observer = new MutationObserver(client, reviewMutations.report(3));

    await observer.mutate({ reason: 'ABUSE', detail: '' });
    await observer.mutate({ reason: 'ETC', detail: '광고 링크가 있어요' });

    expect(bodies).toEqual([
      { reason: 'ABUSE' },
      { reason: 'ETC', detail: '광고 링크가 있어요' },
    ]);
  });

  it('이미 신고한 후기(409)와 내 후기(400)는 코드로 구분되는 ApiError다', async () => {
    server.use(
      http.post(`${BASE}/api/reviews/3/reports`, () =>
        errorBody('REVIEW_ALREADY_REPORTED', 409),
      ),
      http.post(`${BASE}/api/reviews/4/reports`, () =>
        errorBody('CANNOT_REPORT_OWN_REVIEW', 400),
      ),
    );
    const client = new QueryClient();

    await expect(
      new MutationObserver(client, reviewMutations.report(3)).mutate({
        reason: 'SPAM',
        detail: '',
      }),
    ).rejects.toMatchObject({ status: 409, code: 'REVIEW_ALREADY_REPORTED' });
    await expect(
      new MutationObserver(client, reviewMutations.report(4)).mutate({
        reason: 'SPAM',
        detail: '',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'CANNOT_REPORT_OWN_REVIEW' });
  });
});

describe('reviewQueries.myReview', () => {
  it('내 후기 목록을 넘기며 찾고, 끝까지 없으면 null이다', async () => {
    const requestedPages: string[] = [];
    server.use(
      http.get(`${BASE}/api/users/me/reviews`, ({ request }) => {
        const url = new URL(request.url);
        const pageNumber = Number(url.searchParams.get('page'));
        requestedPages.push(`${pageNumber}:${url.searchParams.get('size')}`);
        return HttpResponse.json(
          page([review({ id: 10 + pageNumber })], pageNumber, 2),
        );
      }),
    );
    const client = new QueryClient();

    const found = await client.fetchQuery(reviewQueries.myReview(11));
    const missing = await client.fetchQuery(reviewQueries.myReview(99));

    expect(found?.id).toBe(11);
    expect(missing).toBeNull();
    expect(requestedPages).toEqual(['0:100', '1:100', '0:100', '1:100']);
  });
});
