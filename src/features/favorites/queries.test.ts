import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { server } from '@/test/server';

import {
  applyFavoriteToggle,
  type FavoriteHospital,
  favoriteKeys,
  favoriteMutations,
  favoriteQueries,
  isFavoriteIn,
} from './queries';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const BASE = 'http://app.test/bff';

const favorite = (ykiho: string, name = `병원 ${ykiho}`): FavoriteHospital => ({
  ykiho,
  available: true,
  name,
  className: '의원',
  address: '서울특별시 강남구',
  phone: null,
  favoritedAt: '2026-10-01T00:00:00Z',
});

const page = (
  content: FavoriteHospital[],
  pageNumber: number,
  totalPages: number,
) => ({ content, page: pageNumber, size: 100, totalElements: 0, totalPages });

const serverError = () =>
  HttpResponse.json(
    { code: 'INTERNAL_ERROR', message: '오류', errors: [] },
    { status: 500 },
  );

function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
}

describe('favoriteQueries.list', () => {
  it('모든 페이지를 차례로 불러와 하나의 목록으로 합친다', async () => {
    const pages: string[] = [];
    server.use(
      http.get(`${BASE}/api/users/me/favorites`, ({ request }) => {
        const url = new URL(request.url);
        const pageNumber = Number(url.searchParams.get('page'));
        pages.push(`${pageNumber}:${url.searchParams.get('size')}`);
        return HttpResponse.json(
          page([favorite(`H${pageNumber}`)], pageNumber, 2),
        );
      }),
    );

    const list = await newClient().fetchQuery(favoriteQueries.list());

    expect(pages).toEqual(['0:100', '1:100']);
    expect(list.map((item) => item.ykiho)).toEqual(['H0', 'H1']);
  });

  it('찜한 병원이 없으면 빈 목록이다', async () => {
    server.use(
      http.get(`${BASE}/api/users/me/favorites`, () =>
        HttpResponse.json(page([], 0, 0)),
      ),
    );

    expect(await newClient().fetchQuery(favoriteQueries.list())).toEqual([]);
  });

  it('백엔드 장애는 ApiError로 실패한다', async () => {
    server.use(http.get(`${BASE}/api/users/me/favorites`, serverError));

    await expect(
      newClient().fetchQuery(favoriteQueries.list()),
    ).rejects.toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });
});

describe('applyFavoriteToggle', () => {
  const now = new Date('2026-11-01T00:00:00Z');

  it('찜하면 맨 앞에 넣는다', () => {
    const next = applyFavoriteToggle(
      [favorite('A')],
      {
        ykiho: 'B',
        isFavorite: true,
        hospital: {
          name: '새 병원',
          className: '병원',
          address: null,
          phone: null,
        },
      },
      now,
    );

    expect(next.map((item) => item.ykiho)).toEqual(['B', 'A']);
    expect(next[0]).toMatchObject({
      name: '새 병원',
      available: true,
      favoritedAt: now.toISOString(),
    });
  });

  it('이미 찜한 병원을 다시 찜해도 한 번만 남는다', () => {
    const next = applyFavoriteToggle([favorite('A')], {
      ykiho: 'A',
      isFavorite: true,
    });

    expect(next).toEqual([favorite('A')]);
  });

  it('해제하면 목록에서 뺀다', () => {
    const next = applyFavoriteToggle([favorite('A'), favorite('B')], {
      ykiho: 'A',
      isFavorite: false,
    });

    expect(next.map((item) => item.ykiho)).toEqual(['B']);
  });

  it('목록에 있는지로 하트 상태를 정한다', () => {
    expect(isFavoriteIn([favorite('A')], 'A')).toBe(true);
    expect(isFavoriteIn([favorite('A')], 'B')).toBe(false);
    expect(isFavoriteIn(undefined, 'A')).toBe(false);
  });
});

describe('favoriteMutations.toggle', () => {
  it('찜하면 POST를 보내고 응답 전에 목록에 먼저 넣는다', async () => {
    const client = newClient();
    client.setQueryData(favoriteKeys.list(), [favorite('A')]);
    let method: string | undefined;
    server.use(
      http.post(`${BASE}/api/users/me/favorites/B`, async ({ request }) => {
        method = request.method;
        await delay(20);
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${BASE}/api/users/me/favorites`, () =>
        HttpResponse.json(page([favorite('B'), favorite('A')], 0, 1)),
      ),
    );
    const observer = new MutationObserver(client, favoriteMutations.toggle());

    const pending = observer.mutate({ ykiho: 'B', isFavorite: true });
    await vi.waitFor(() =>
      expect(isFavoriteIn(client.getQueryData(favoriteKeys.list()), 'B')).toBe(
        true,
      ),
    );
    await pending;

    expect(method).toBe('POST');
  });

  it('해제가 실패하면 목록을 원래대로 되돌린다', async () => {
    const client = newClient();
    const before = [favorite('A'), favorite('B')];
    client.setQueryData(favoriteKeys.list(), before);
    server.use(
      http.delete(`${BASE}/api/users/me/favorites/A`, async () => {
        await delay(300);
        return serverError();
      }),
      http.get(`${BASE}/api/users/me/favorites`, () =>
        HttpResponse.json(page(before, 0, 1)),
      ),
    );
    const observer = new MutationObserver(client, favoriteMutations.toggle());

    const failed = expect(
      observer.mutate({ ykiho: 'A', isFavorite: false }),
    ).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
    await vi.waitFor(
      () =>
        expect(
          isFavoriteIn(client.getQueryData(favoriteKeys.list()), 'A'),
        ).toBe(false),
      { interval: 5 },
    );
    await failed;

    expect(client.getQueryData(favoriteKeys.list())).toEqual(before);
  });

  it('없는 병원(404)을 찜하면 실패하고 목록에 남기지 않는다', async () => {
    const client = newClient();
    client.setQueryData(favoriteKeys.list(), []);
    server.use(
      http.post(`${BASE}/api/users/me/favorites/X`, () =>
        HttpResponse.json(
          { code: 'HOSPITAL_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
      http.get(`${BASE}/api/users/me/favorites`, () =>
        HttpResponse.json(page([], 0, 0)),
      ),
    );
    const observer = new MutationObserver(client, favoriteMutations.toggle());

    await expect(
      observer.mutate({ ykiho: 'X', isFavorite: true }),
    ).rejects.toMatchObject({ code: 'HOSPITAL_NOT_FOUND' });

    expect(client.getQueryData(favoriteKeys.list())).toEqual([]);
  });

  it('끝나면 목록을 무효화해 서버 값으로 다시 맞춘다', async () => {
    const client = newClient();
    client.setQueryData(favoriteKeys.list(), [favorite('A')]);
    server.use(
      http.delete(
        `${BASE}/api/users/me/favorites/B`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const observer = new MutationObserver(client, favoriteMutations.toggle());

    await observer.mutate({ ykiho: 'B', isFavorite: false });

    expect(client.getQueryState(favoriteKeys.list())?.isInvalidated).toBe(true);
  });

  it('연달아 누른 변경이 남아 있으면 앞 변경이 끝나도 무효화하지 않는다', async () => {
    const client = newClient();
    client.setQueryData(favoriteKeys.list(), []);
    server.use(
      http.post(
        `${BASE}/api/users/me/favorites/A`,
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.delete(`${BASE}/api/users/me/favorites/A`, async () => {
        await delay(50);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const first = new MutationObserver(client, favoriteMutations.toggle());
    const second = new MutationObserver(client, favoriteMutations.toggle());

    const firstDone = first.mutate({ ykiho: 'A', isFavorite: true });
    const secondDone = second.mutate({ ykiho: 'A', isFavorite: false });
    await firstDone;

    expect(client.getQueryState(favoriteKeys.list())?.isInvalidated).toBe(
      false,
    );
    expect(client.getQueryData(favoriteKeys.list())).toEqual([]);
    await secondDone;
    expect(client.getQueryState(favoriteKeys.list())?.isInvalidated).toBe(true);
  });

  it('목록을 아직 불러오지 않았으면 캐시를 만들지 않고 요청만 보낸다', async () => {
    const client = newClient();
    const post = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(http.post(`${BASE}/api/users/me/favorites/A`, post));
    const observer = new MutationObserver(client, favoriteMutations.toggle());

    await observer.mutate({ ykiho: 'A', isFavorite: true });

    expect(post).toHaveBeenCalledOnce();
    expect(client.getQueryData(favoriteKeys.list())).toBeUndefined();
  });
});
