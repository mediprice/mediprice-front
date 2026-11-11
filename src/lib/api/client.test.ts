import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/server';

import { createApiClient } from './client';
import { ApiError, NetworkError } from './errors';
import { unwrap } from './unwrap';

const BASE = 'http://app.test/bff';
const SIDO = `${BASE}/api/regions/sido`;
const REFRESH = `${BASE}/session/refresh`;

const sido = [{ code: '110000', name: '서울' }];
const expired = () =>
  HttpResponse.json(
    { code: 'EXPIRED_ACCESS_TOKEN', message: '만료', errors: [] },
    { status: 401 },
  );

function setup() {
  const onSessionExpired = vi.fn();
  const client = createApiClient({ baseUrl: BASE, onSessionExpired });
  return { client, onSessionExpired };
}

/** 처음 `failures`번은 401, 이후에는 성공하는 핸들러 */
function failThenSucceed(failures: number) {
  let calls = 0;
  server.use(
    http.get(SIDO, () => {
      calls += 1;
      return calls <= failures ? expired() : HttpResponse.json(sido);
    }),
  );
  return () => calls;
}

describe('401 처리', () => {
  it('재발급에 성공하면 같은 요청을 한 번 다시 보낸다', async () => {
    const calls = failThenSucceed(1);
    let refreshes = 0;
    server.use(
      http.post(REFRESH, () => {
        refreshes += 1;
        return HttpResponse.json({ authenticated: true });
      }),
    );
    const { client } = setup();

    const result = await client.GET('/api/regions/sido');

    expect(result.data).toEqual(sido);
    expect(calls()).toBe(2);
    expect(refreshes).toBe(1);
  });

  it('본문이 있는 요청도 재시도할 때 본문을 유지한다', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${BASE}/api/hospitals/H1/reviews`, async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1
          ? expired()
          : HttpResponse.json({ id: 1 }, { status: 201 });
      }),
      http.post(REFRESH, () => HttpResponse.json({ authenticated: true })),
    );
    const { client } = setup();

    const result = await client.POST('/api/hospitals/{ykiho}/reviews', {
      params: { path: { ykiho: 'H1' } },
      body: { rating: 5, content: '좋아요' },
    });

    expect(result.response.status).toBe(201);
    expect(bodies).toEqual([
      { rating: 5, content: '좋아요' },
      { rating: 5, content: '좋아요' },
    ]);
  });

  it('동시에 만료된 요청이 여러 개여도 재발급은 한 번이다', async () => {
    let refreshes = 0;
    let authorized = false;
    server.use(
      http.get(SIDO, () => (authorized ? HttpResponse.json(sido) : expired())),
      http.post(REFRESH, async () => {
        refreshes += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        authorized = true;
        return HttpResponse.json({ authenticated: true });
      }),
    );
    const { client } = setup();

    const results = await Promise.all([
      client.GET('/api/regions/sido'),
      client.GET('/api/regions/sido'),
      client.GET('/api/regions/sido'),
    ]);

    expect(results.map((r) => r.data)).toEqual([sido, sido, sido]);
    expect(refreshes).toBe(1);
  });

  it('재시도도 401이면 더 반복하지 않고 그 응답을 돌려준다', async () => {
    const calls = failThenSucceed(Number.POSITIVE_INFINITY);
    let refreshes = 0;
    server.use(
      http.post(REFRESH, () => {
        refreshes += 1;
        return HttpResponse.json({ authenticated: true });
      }),
    );
    const { client } = setup();

    const result = await client.GET('/api/regions/sido');

    expect(result.response.status).toBe(401);
    expect(calls()).toBe(2);
    expect(refreshes).toBe(1);
  });

  it('재발급이 거부되면 세션 만료를 알리고 원래 401을 돌려준다', async () => {
    failThenSucceed(Number.POSITIVE_INFINITY);
    server.use(
      http.post(REFRESH, () => new HttpResponse(null, { status: 401 })),
    );
    const { client, onSessionExpired } = setup();

    const result = await client.GET('/api/regions/sido');

    expect(result.response.status).toBe(401);
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it('재발급이 장애(502)면 세션 만료로 보지 않는다', async () => {
    failThenSucceed(Number.POSITIVE_INFINITY);
    server.use(
      http.post(REFRESH, () => new HttpResponse(null, { status: 502 })),
    );
    const { client, onSessionExpired } = setup();

    const result = await client.GET('/api/regions/sido');

    expect(result.response.status).toBe(401);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('세션 요청의 401은 재발급을 시도하지 않는다', async () => {
    let refreshes = 0;
    server.use(
      http.post(REFRESH, () => {
        refreshes += 1;
        return new HttpResponse(null, { status: 401 });
      }),
      http.get(
        `${BASE}/session`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    const { onSessionExpired } = setup();
    const { createApiFetch } = await import('./client');
    const apiFetch = createApiFetch({ baseUrl: BASE, onSessionExpired });

    const response = await apiFetch(new Request(`${BASE}/session`));

    expect(response.status).toBe(401);
    expect(refreshes).toBe(0);
  });

  it('401이 아닌 오류는 재발급 없이 그대로 돌려준다', async () => {
    server.use(
      http.get(SIDO, () =>
        HttpResponse.json(
          { code: 'SIDO_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );
    const { client } = setup();

    const result = await client.GET('/api/regions/sido');

    expect(result.response.status).toBe(404);
  });
});

describe('unwrap', () => {
  it('성공하면 데이터를 돌려준다', async () => {
    server.use(http.get(SIDO, () => HttpResponse.json(sido)));
    const { client } = setup();

    expect(await unwrap(client.GET('/api/regions/sido'))).toEqual(sido);
  });

  it('실패 응답은 ApiError로 던진다', async () => {
    server.use(
      http.get(SIDO, () =>
        HttpResponse.json(
          { code: 'SIDO_NOT_FOUND', message: '없음', errors: [] },
          { status: 404 },
        ),
      ),
    );
    const { client } = setup();

    await expect(unwrap(client.GET('/api/regions/sido'))).rejects.toMatchObject(
      {
        name: 'ApiError',
        status: 404,
        code: 'SIDO_NOT_FOUND',
      },
    );
    await expect(
      unwrap(client.GET('/api/regions/sido')),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('연결 실패는 NetworkError로 던진다', async () => {
    server.use(http.get(SIDO, () => HttpResponse.error()));
    const { client } = setup();

    await expect(
      unwrap(client.GET('/api/regions/sido')),
    ).rejects.toBeInstanceOf(NetworkError);
  });
});
