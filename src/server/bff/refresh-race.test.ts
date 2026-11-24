import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@/lib/api/client';
import { createRefresher } from '@/lib/api/refresh';
import { API, server } from '@/test/server';

import { sessionCookieNames } from './cookies';
import { coalesceRefresh } from './refresh-coalescer';
import { refreshResponse, refreshSession } from './refresh-session';
import { unauthenticated } from './responses';

const { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE } = sessionCookieNames();

const sido = [{ code: '110000', name: '서울' }];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 두 탭이 함께 쓰는 브라우저 쿠키. 요청을 보낼 때 읽고, 응답이 도착하면 Set-Cookie를 반영한다. */
function cookieJar() {
  const jar = new Map([
    [ACCESS_COOKIE, 'a0'],
    [REFRESH_COOKIE, 'r0'],
  ]);
  function apply(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const [pair = ''] = cookie.split(';');
      const [name = '', value = ''] = pair.split('=');
      if (/Max-Age=0/i.test(cookie)) jar.delete(name);
      else jar.set(name, value);
    }
  }
  return { jar, apply };
}

/**
 * 백엔드(PR #35)처럼 Refresh를 회전시킨다. 회전에 쓴 Refresh가 유예 시간 안에 다시 오면 401 REFRESH_TOKEN_ALREADY_ROTATED,
 * 지나서 오면 그 회원의 Refresh를 모두 폐기하고 401 INVALID_REFRESH_TOKEN이다. 처리 시간(latencyMs)이 지난 뒤 판정한다.
 */
function rotatingBackend({ latencyMs = 20, graceMs = 30_000 } = {}) {
  const valid = new Set(['r0']);
  const rotatedAt = new Map<string, number>();
  let issued = 0;
  let revoked = false;
  let currentAccess: string | null = null;

  server.use(
    http.post(`${API}/api/auth/refresh`, async ({ request }) => {
      const { refreshToken } = (await request.json()) as {
        refreshToken: string;
      };
      await delay(latencyMs);
      if (valid.delete(refreshToken)) {
        rotatedAt.set(refreshToken, Date.now());
        issued += 1;
        currentAccess = `a${issued}`;
        valid.add(`r${issued}`);
        return HttpResponse.json({
          accessToken: currentAccess,
          refreshToken: `r${issued}`,
          tokenType: 'Bearer',
          expiresIn: 900,
        });
      }
      const at = rotatedAt.get(refreshToken);
      if (at !== undefined && Date.now() - at < graceMs) {
        return HttpResponse.json(
          { code: 'REFRESH_TOKEN_ALREADY_ROTATED', message: '', errors: [] },
          { status: 401 },
        );
      }
      if (at !== undefined) {
        valid.clear();
        revoked = true;
      }
      return HttpResponse.json(
        { code: 'INVALID_REFRESH_TOKEN', message: '', errors: [] },
        { status: 401 },
      );
    }),
  );
  return {
    isValidAccess: (token: string | undefined) =>
      token !== undefined && token === currentAccess,
    isRevoked: () => revoked,
  };
}

/** Vercel 인스턴스 하나. 재발급 라우트(POST /bff/session/refresh)와 같은 조합이고, 인스턴스마다 합치는 상태를 따로 가진다. */
function bffInstance(
  base: string,
  browser: ReturnType<typeof cookieJar>,
  backend: ReturnType<typeof rotatingBackend>,
  { responseDelayMs = 0 } = {},
) {
  const refreshOnce = coalesceRefresh(refreshSession);
  server.use(
    http.post(`${base}/session/refresh`, async () => {
      const result = await refreshOnce(
        browser.jar.get(REFRESH_COOKIE),
        new Headers(),
      );
      const response = refreshResponse(result, unauthenticated);
      await delay(responseDelayMs);
      browser.apply(response);
      return response;
    }),
    http.get(`${base}/api/regions/sido`, () =>
      backend.isValidAccess(browser.jar.get(ACCESS_COOKIE))
        ? HttpResponse.json(sido)
        : HttpResponse.json(
            { code: 'EXPIRED_ACCESS_TOKEN', message: '', errors: [] },
            { status: 401 },
          ),
    ),
  );
}

/** 탭 하나. 재발급을 합치는 상태가 탭마다 따로라 두 탭은 각자 재발급을 요청한다. */
function tab(base: string) {
  const onSessionExpired = vi.fn();
  const client = createApiClient({
    baseUrl: base,
    onSessionExpired,
    refresh: createRefresher(base),
  });
  return { client, onSessionExpired };
}

describe('Access 만료 뒤 두 탭이 동시에 재발급할 때', () => {
  it('서로 다른 인스턴스로 가도 진 쪽은 쿠키를 지우지 않고, 이긴 쪽의 새 쿠키로 재시도해 둘 다 성공한다', async () => {
    const browser = cookieJar();
    const backend = rotatingBackend();
    bffInstance('http://a.test/bff', browser, backend);
    bffInstance('http://b.test/bff', browser, backend);
    const first = tab('http://a.test/bff');
    const second = tab('http://b.test/bff');

    const results = await Promise.all([
      first.client.GET('/api/regions/sido'),
      second.client.GET('/api/regions/sido'),
    ]);

    expect(results.map((r) => r.data)).toEqual([sido, sido]);
    expect(browser.jar.get(REFRESH_COOKIE)).toBe('r1');
    expect(first.onSessionExpired).not.toHaveBeenCalled();
    expect(second.onSessionExpired).not.toHaveBeenCalled();
    expect(backend.isRevoked()).toBe(false);
  });

  it('같은 인스턴스로 가면 백엔드 재발급은 한 번이고 둘 다 성공한다', async () => {
    const browser = cookieJar();
    const backend = rotatingBackend();
    bffInstance('http://a.test/bff', browser, backend);
    const first = tab('http://a.test/bff');
    const second = tab('http://a.test/bff');

    const results = await Promise.all([
      first.client.GET('/api/regions/sido'),
      second.client.GET('/api/regions/sido'),
    ]);

    expect(results.map((r) => r.data)).toEqual([sido, sido]);
    expect(browser.jar.get(REFRESH_COOKIE)).toBe('r1');
  });

  it('이긴 쪽 응답이 늦게 도착해도 로그아웃되지 않는다(진 쪽 요청 하나만 실패한다)', async () => {
    const browser = cookieJar();
    const backend = rotatingBackend();
    bffInstance('http://a.test/bff', browser, backend, {
      responseDelayMs: 50,
    });
    bffInstance('http://b.test/bff', browser, backend);
    const first = tab('http://a.test/bff');
    const second = tab('http://b.test/bff');

    const [won, lost] = await Promise.all([
      first.client.GET('/api/regions/sido'),
      delay(5).then(() => second.client.GET('/api/regions/sido')),
    ]);

    expect(won.data).toEqual(sido);
    expect(lost.response.status).toBe(401);
    expect(second.onSessionExpired).not.toHaveBeenCalled();
    expect(browser.jar.get(REFRESH_COOKIE)).toBe('r1');
    expect(backend.isRevoked()).toBe(false);

    expect((await second.client.GET('/api/regions/sido')).data).toEqual(sido);
  });

  it('회전 응답을 받지 못한 채 유예 시간이 지나 이전 Refresh가 다시 오면 세션이 끝난다', async () => {
    const browser = cookieJar();
    const backend = rotatingBackend({ graceMs: 0 });
    bffInstance('http://a.test/bff', browser, backend);
    await refreshSession('r0', new Headers());
    const only = tab('http://a.test/bff');

    const result = await only.client.GET('/api/regions/sido');

    expect(result.response.status).toBe(401);
    expect(only.onSessionExpired).toHaveBeenCalledOnce();
    expect(browser.jar.has(REFRESH_COOKIE)).toBe(false);
    expect(backend.isRevoked()).toBe(true);
  });
});
