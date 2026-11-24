import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { server } from '@/test/server';

import {
  historyKeys,
  historyMutations,
  historyQueries,
  type ViewHistory,
} from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

const entry = (id: number, type: ViewHistory['type'] = 'HOSPITAL') => ({
  id,
  type,
  targetKey: `K${id}`,
  title: `제목 ${id}`,
  viewedAt: '2026-10-28T03:00:00Z',
});

const error = (status: number, code: string) =>
  HttpResponse.json({ code, message: '오류', errors: [] }, { status });

function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
}

describe('historyQueries.list', () => {
  it('백엔드가 남기는 최대 개수(100)를 한 번에 받는다', async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/api/users/me/histories`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({
          content: [entry(1)],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        });
      }),
    );

    const list = await newClient().fetchQuery(historyQueries.list());

    expect(url?.searchParams.get('page')).toBe('0');
    expect(url?.searchParams.get('size')).toBe('100');
    expect(list).toEqual([entry(1)]);
  });

  it('백엔드 장애는 ApiError로 실패한다', async () => {
    server.use(
      http.get(`${BASE}/api/users/me/histories`, () =>
        error(500, 'INTERNAL_ERROR'),
      ),
    );

    await expect(
      newClient().fetchQuery(historyQueries.list()),
    ).rejects.toMatchObject({ status: 500 });
  });
});

describe('historyMutations.remove', () => {
  it('응답 전에 목록에서 먼저 뺀다', async () => {
    const client = newClient();
    client.setQueryData(historyKeys.list(), [entry(1), entry(2)]);
    server.use(
      http.delete(`${BASE}/api/users/me/histories/1`, async () => {
        await delay(300);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const observer = new MutationObserver(client, historyMutations.remove());

    const done = observer.mutate(1);
    await vi.waitFor(
      () =>
        expect(
          client
            .getQueryData<ViewHistory[]>(historyKeys.list())
            ?.map(({ id }) => id),
        ).toEqual([2]),
      { interval: 5 },
    );
    await done;

    expect(client.getQueryState(historyKeys.list())?.isInvalidated).toBe(true);
  });

  it('삭제가 실패하면 목록을 되돌린다', async () => {
    const client = newClient();
    const before = [entry(1), entry(2)];
    client.setQueryData(historyKeys.list(), before);
    server.use(
      http.delete(`${BASE}/api/users/me/histories/1`, () =>
        error(500, 'INTERNAL_ERROR'),
      ),
    );
    const observer = new MutationObserver(client, historyMutations.remove());

    await expect(observer.mutate(1)).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
    });

    expect(client.getQueryData(historyKeys.list())).toEqual(before);
  });

  it('이미 지워진 기록(HISTORY_NOT_FOUND)은 성공으로 본다', async () => {
    const client = newClient();
    client.setQueryData(historyKeys.list(), [entry(1)]);
    server.use(
      http.delete(`${BASE}/api/users/me/histories/1`, () =>
        error(404, 'HISTORY_NOT_FOUND'),
      ),
    );
    const observer = new MutationObserver(client, historyMutations.remove());

    await observer.mutate(1);

    expect(client.getQueryData(historyKeys.list())).toEqual([]);
  });
});

describe('historyMutations.clear', () => {
  it('전체 삭제에 성공하면 목록을 비운다', async () => {
    const client = newClient();
    client.setQueryData(historyKeys.list(), [entry(1)]);
    const remove = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(http.delete(`${BASE}/api/users/me/histories`, remove));
    const observer = new MutationObserver(client, historyMutations.clear());

    await observer.mutate();

    expect(remove).toHaveBeenCalledOnce();
    expect(client.getQueryData(historyKeys.list())).toEqual([]);
  });

  it('전체 삭제가 실패하면 목록을 그대로 둔다', async () => {
    const client = newClient();
    client.setQueryData(historyKeys.list(), [entry(1)]);
    server.use(
      http.delete(`${BASE}/api/users/me/histories`, () =>
        error(503, 'UPSTREAM_UNAVAILABLE'),
      ),
    );
    const observer = new MutationObserver(client, historyMutations.clear());

    await expect(observer.mutate()).rejects.toMatchObject({ status: 503 });

    expect(client.getQueryData(historyKeys.list())).toEqual([entry(1)]);
  });
});
