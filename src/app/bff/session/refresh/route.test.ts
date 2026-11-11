import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/bff/cookies';
import { bffRequest } from '@/test/request';
import { API, server } from '@/test/server';

import { POST } from './route';

const request = (
  cookies: Record<string, string> = { [REFRESH_COOKIE]: 'r1' },
  origin?: string,
) => bffRequest('/bff/session/refresh', { method: 'POST', cookies, origin });

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

  it('다른 출처에서 온 요청은 403이다', async () => {
    const response = await POST(
      request({ [REFRESH_COOKIE]: 'r1' }, 'https://evil.example'),
    );

    expect(response.status).toBe(403);
  });
});
