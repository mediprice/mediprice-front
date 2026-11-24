import { randomUUID } from 'node:crypto';

import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { sessionCookieNames } from '@/server/bff/cookies';
import { bffRequest } from '@/test/request';
import { API, server } from '@/test/server';

import { POST } from './route';

const { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE } = sessionCookieNames();

/** 같은 인스턴스는 성공한 재발급을 잠시 다시 쓰므로 테스트마다 다른 Refresh를 쓴다. */
const freshCookies = () => ({ [REFRESH_COOKIE]: randomUUID() });

const request = (
  cookies: Record<string, string> = freshCookies(),
  origin?: string,
) => bffRequest('/bff/session/refresh', { method: 'POST', cookies, origin });

/** 백엔드처럼 Refresh를 회전시켜, 처음 한 번만 새 토큰을 주고 이후 같은 Refresh는 거부한다. */
function rotatingBackend() {
  let calls = 0;
  server.use(
    http.post(`${API}/api/auth/refresh`, async () => {
      calls += 1;
      if (calls > 1) {
        return HttpResponse.json(
          { code: 'INVALID_REFRESH_TOKEN', message: '무효', errors: [] },
          { status: 401 },
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
      return HttpResponse.json({
        accessToken: 'a2',
        refreshToken: 'r2',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    }),
  );
  return () => calls;
}

function expectNewCookies(response: Response) {
  const cookies = response.headers.getSetCookie();
  expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=a2`))).toBe(true);
  expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=r2`))).toBe(true);
  expect(cookies.some((c) => /Max-Age=0/i.test(c))).toBe(false);
}

describe('POST /bff/session/refresh', () => {
  it('재발급해서 두 쿠키를 새 값으로 교체한다', async () => {
    server.use(
      http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json({
          accessToken: 'a2',
          refreshToken: 'r2',
          tokenType: 'Bearer',
          expiresIn: 3600,
        }),
      ),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=a2`))).toBe(true);
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=r2`))).toBe(
      true,
    );
  });

  it('Refresh 쿠키가 없으면 401이고 쿠키를 지운다', async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(response.headers.getSetCookie()).toHaveLength(2);
  });

  it('백엔드가 거부하면 401이고 쿠키를 지운다', async () => {
    server.use(
      http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json(
          { code: 'INVALID_REFRESH_TOKEN', message: '무효', errors: [] },
          { status: 401 },
        ),
      ),
    );

    const response = await POST(request());

    expect(response.status).toBe(401);
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    expect(cookies.every((c) => /Max-Age=0/i.test(c))).toBe(true);
  });

  it('백엔드에 닿지 못하면 502이고 쿠키는 그대로 둔다', async () => {
    server.use(
      http.post(`${API}/api/auth/refresh`, () => HttpResponse.error()),
    );

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('같은 Refresh로 동시에 와도 백엔드는 한 번이고 진 쪽이 쿠키를 지우지 않는다', async () => {
    const calls = rotatingBackend();
    const cookies = freshCookies();

    const responses = await Promise.all([
      POST(request(cookies)),
      POST(request(cookies)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    responses.forEach(expectNewCookies);
    expect(calls()).toBe(1);
  });

  it('회전 직후 이전 Refresh로 늦게 온 요청은 200이지만 쿠키를 주지도 지우지도 않는다', async () => {
    const calls = rotatingBackend();
    const cookies = freshCookies();

    await POST(request(cookies));
    const late = await POST(request(cookies));

    expect(late.status).toBe(200);
    expect(await late.json()).toEqual({ authenticated: true });
    expect(late.headers.getSetCookie()).toEqual([]);
    expect(calls()).toBe(1);
  });

  it('회전된 Refresh로는 새 토큰을 얻을 수 없다', async () => {
    rotatingBackend();
    const cookies = freshCookies();

    await POST(request(cookies));
    const replayed = await POST(request(cookies));
    const body = JSON.stringify(await replayed.json());

    expect(body).not.toContain('a2');
    expect(body).not.toContain('r2');
    const setCookies = replayed.headers.getSetCookie().join(';');
    expect(setCookies).not.toContain('a2');
    expect(setCookies).not.toContain('r2');
  });

  it('다른 출처에서 온 요청은 403이다', async () => {
    const response = await POST(
      request(freshCookies(), 'https://evil.example'),
    );

    expect(response.status).toBe(403);
  });
});
