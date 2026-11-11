import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/bff/cookies';
import { bffRequest } from '@/test/request';
import { API, server } from '@/test/server';

import { DELETE, GET, POST } from './route';

const tokens = { accessToken: 'a1', refreshToken: 'r1', expiresIn: 3600 };

function setCookies(response: Response) {
  return response.headers.getSetCookie();
}

describe('POST /bff/session', () => {
  it('두 토큰을 httpOnly 쿠키로 설정한다', async () => {
    const response = await POST(
      bffRequest('/bff/session', { method: 'POST', body: tokens }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
    const cookies = setCookies(response);
    expect(cookies.find((c) => c.startsWith(`${ACCESS_COOKIE}=a1`))).toMatch(
      /HttpOnly/i,
    );
    expect(cookies.find((c) => c.startsWith(`${REFRESH_COOKIE}=r1`))).toMatch(
      /Path=\/bff\/session/,
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it.each([
    ['빈 본문', undefined],
    ['토큰 누락', { accessToken: 'a1' }],
    ['빈 토큰', { ...tokens, refreshToken: '' }],
    ['음수 수명', { ...tokens, expiresIn: -1 }],
    ['문자열 수명', { ...tokens, expiresIn: '3600' }],
  ])('%s이면 400이고 쿠키를 설정하지 않는다', async (_name, body) => {
    const response = await POST(
      bffRequest('/bff/session', { method: 'POST', body }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'INVALID_INPUT' });
    expect(setCookies(response)).toEqual([]);
  });

  it('다른 출처에서 온 요청은 403이다', async () => {
    const response = await POST(
      bffRequest('/bff/session', {
        method: 'POST',
        body: tokens,
        origin: 'https://evil.example',
      }),
    );

    expect(response.status).toBe(403);
    expect(setCookies(response)).toEqual([]);
  });
});

describe('GET /bff/session', () => {
  it('Access 쿠키가 있으면 백엔드를 부르지 않고 로그인 상태다', async () => {
    const response = await GET(
      bffRequest('/bff/session', { cookies: { [ACCESS_COOKIE]: 'a1' } }),
    );

    expect(await response.json()).toEqual({ authenticated: true });
    expect(setCookies(response)).toEqual([]);
  });

  it('쿠키가 없으면 로그아웃 상태다', async () => {
    const response = await GET(bffRequest('/bff/session'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: false });
  });

  it('Refresh만 있으면 재발급해서 쿠키를 새로 설정한다', async () => {
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

    const response = await GET(
      bffRequest('/bff/session', { cookies: { [REFRESH_COOKIE]: 'r1' } }),
    );

    expect(await response.json()).toEqual({ authenticated: true });
    expect(
      setCookies(response).some((c) => c.startsWith(`${ACCESS_COOKIE}=a2`)),
    ).toBe(true);
    expect(
      setCookies(response).some((c) => c.startsWith(`${REFRESH_COOKIE}=r2`)),
    ).toBe(true);
  });

  it('Refresh가 거부되면 쿠키를 지우고 로그아웃 상태다', async () => {
    server.use(
      http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json(
          { code: 'EXPIRED_REFRESH_TOKEN', message: '만료', errors: [] },
          { status: 401 },
        ),
      ),
    );

    const response = await GET(
      bffRequest('/bff/session', { cookies: { [REFRESH_COOKIE]: 'r1' } }),
    );

    expect(await response.json()).toEqual({ authenticated: false });
    expect(setCookies(response).every((c) => /Max-Age=0/i.test(c))).toBe(true);
    expect(setCookies(response)).toHaveLength(2);
  });

  it('백엔드에 닿지 못하면 502이고 쿠키는 그대로 둔다', async () => {
    server.use(
      http.post(`${API}/api/auth/refresh`, () => HttpResponse.error()),
    );

    const response = await GET(
      bffRequest('/bff/session', { cookies: { [REFRESH_COOKIE]: 'r1' } }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    });
    expect(setCookies(response)).toEqual([]);
  });
});

describe('DELETE /bff/session', () => {
  it('백엔드에 로그아웃을 알리고 쿠키를 지운다', async () => {
    let received: unknown;
    server.use(
      http.post(`${API}/api/auth/logout`, async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const response = await DELETE(
      bffRequest('/bff/session', {
        method: 'DELETE',
        cookies: { [REFRESH_COOKIE]: 'r1' },
      }),
    );

    expect(response.status).toBe(204);
    expect(received).toEqual({ refreshToken: 'r1' });
    expect(setCookies(response)).toHaveLength(2);
    expect(setCookies(response).every((c) => /Max-Age=0/i.test(c))).toBe(true);
  });

  it('백엔드 로그아웃이 실패해도 쿠키는 지운다', async () => {
    server.use(http.post(`${API}/api/auth/logout`, () => HttpResponse.error()));

    const response = await DELETE(
      bffRequest('/bff/session', {
        method: 'DELETE',
        cookies: { [REFRESH_COOKIE]: 'r1' },
      }),
    );

    expect(response.status).toBe(204);
    expect(setCookies(response)).toHaveLength(2);
  });

  it('쿠키가 없어도 204다', async () => {
    const response = await DELETE(
      bffRequest('/bff/session', { method: 'DELETE' }),
    );

    expect(response.status).toBe(204);
  });

  it('다른 출처에서 온 요청은 403이다', async () => {
    const response = await DELETE(
      bffRequest('/bff/session', {
        method: 'DELETE',
        origin: 'https://evil.example',
      }),
    );

    expect(response.status).toBe(403);
  });
});
