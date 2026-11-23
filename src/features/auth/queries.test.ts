import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as ClientModule from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { server } from '@/test/server';

import {
  fetchCurrentUser,
  getSession,
  markSignedOut,
  sessionKeys,
} from './queries';

const BASE = 'http://app.test/bff';

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    apiClient: actual.createApiClient({ baseUrl: 'http://app.test/bff' }),
  };
});

const user = {
  id: 1,
  email: 'user@example.com',
  name: '건강한하루',
  profileImageUrl: null,
  role: 'USER',
};

function sessionIs(authenticated: boolean) {
  return http.get(`${BASE}/session`, () =>
    HttpResponse.json({ authenticated }),
  );
}

function refreshableSession() {
  return http.get(`${BASE}/session`, () =>
    HttpResponse.json({ authenticated: false, refreshable: true }),
  );
}

describe('getSession', () => {
  it.each([
    [true, 'authenticated'],
    [false, 'anonymous'],
  ])('authenticated=%s이면 %s다', async (authenticated, expected) => {
    server.use(sessionIs(authenticated));

    expect(await getSession(BASE)).toBe(expected);
  });

  it('BFF가 502면 unavailable이다', async () => {
    server.use(
      http.get(
        `${BASE}/session`,
        () => new HttpResponse(null, { status: 502 }),
      ),
    );

    expect(await getSession(BASE)).toBe('unavailable');
  });

  it('응답이 약속된 형식이 아니면 unavailable이다', async () => {
    server.use(http.get(`${BASE}/session`, () => HttpResponse.json({ ok: 1 })));

    expect(await getSession(BASE)).toBe('unavailable');
  });

  it('연결에 실패하면 unavailable이다', async () => {
    server.use(http.get(`${BASE}/session`, () => HttpResponse.error()));

    expect(await getSession(BASE)).toBe('unavailable');
  });

  it.each([
    [200, 'authenticated'],
    [401, 'anonymous'],
    [502, 'unavailable'],
  ] as const)(
    'Refresh만 남았으면 공용 재발급을 거친다(재발급 %i이면 %s)',
    async (status, expected) => {
      server.use(
        refreshableSession(),
        http.post(`${BASE}/session/refresh`, () =>
          status === 200
            ? HttpResponse.json({ authenticated: true })
            : new HttpResponse(null, { status }),
        ),
      );

      expect(await getSession(BASE)).toBe(expected);
    },
  );

  it('세션 확인과 API 401이 겹쳐도 재발급은 한 번이다', async () => {
    let refreshes = 0;
    let authorized = false;
    server.use(
      refreshableSession(),
      http.get(`${BASE}/api/users/me`, () =>
        authorized
          ? HttpResponse.json(user)
          : HttpResponse.json(
              { code: 'EXPIRED_ACCESS_TOKEN', message: 'x', errors: [] },
              { status: 401 },
            ),
      ),
      http.post(`${BASE}/session/refresh`, async () => {
        refreshes += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        authorized = true;
        return HttpResponse.json({ authenticated: true });
      }),
    );
    const { apiClient } = await import('@/lib/api/client');

    const [session, me] = await Promise.all([
      getSession(BASE),
      apiClient.GET('/api/users/me'),
    ]);

    expect(session).toBe('authenticated');
    expect(me.data).toEqual(user);
    expect(refreshes).toBe(1);
  });
});

describe('fetchCurrentUser', () => {
  it('로그인했으면 내 정보를 돌려준다', async () => {
    server.use(
      sessionIs(true),
      http.get(`${BASE}/api/users/me`, () => HttpResponse.json(user)),
    );

    expect(await fetchCurrentUser(BASE)).toEqual(user);
  });

  it('로그인하지 않았으면 내 정보를 묻지 않고 null이다', async () => {
    const me = vi.fn(() => HttpResponse.json(user));
    server.use(sessionIs(false), http.get(`${BASE}/api/users/me`, me));

    expect(await fetchCurrentUser(BASE)).toBeNull();
    expect(me).not.toHaveBeenCalled();
  });

  it('토큰이 거부되고 재발급도 안 되면(401) 에러가 아니라 null이다', async () => {
    server.use(
      sessionIs(true),
      http.get(`${BASE}/api/users/me`, () =>
        HttpResponse.json(
          { code: 'INVALID_ACCESS_TOKEN', message: 'x', errors: [] },
          { status: 401 },
        ),
      ),
      http.post(`${BASE}/session/refresh`, () =>
        HttpResponse.json(
          { code: 'INVALID_REFRESH_TOKEN', message: 'x', errors: [] },
          { status: 401 },
        ),
      ),
    );

    expect(await fetchCurrentUser(BASE)).toBeNull();
  });

  it('세션을 확인할 수 없으면 에러를 던진다', async () => {
    server.use(
      http.get(
        `${BASE}/session`,
        () => new HttpResponse(null, { status: 502 }),
      ),
    );

    await expect(fetchCurrentUser(BASE)).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
  });

  it('401이 아닌 실패는 그대로 던진다', async () => {
    server.use(
      sessionIs(true),
      http.get(`${BASE}/api/users/me`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'x', errors: [] },
          { status: 500 },
        ),
      ),
    );

    await expect(fetchCurrentUser(BASE)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('markSignedOut', () => {
  it('다른 쿼리는 지우고 세션은 null로 바꾼다', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(sessionKeys.current(), user);
    queryClient.setQueryData(['favorites', 'list'], [1, 2]);

    markSignedOut(queryClient);

    expect(queryClient.getQueryData(sessionKeys.current())).toBeNull();
    expect(queryClient.getQueryData(['favorites', 'list'])).toBeUndefined();
  });
});
