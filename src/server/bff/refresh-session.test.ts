import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { API, server } from '@/test/server';

import { ACCESS_COOKIE, REFRESH_COOKIE } from './cookies';
import { refreshResponse, refreshSession } from './refresh-session';
import { errorResponse } from './responses';

const newTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('refreshSession', () => {
  it('Refresh를 백엔드에 보내 새 토큰을 받는다', async () => {
    let received: unknown;
    server.use(
      http.post(`${API}/api/auth/refresh`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(newTokens);
      }),
    );

    expect(await refreshSession('old-refresh')).toEqual({
      status: 'ok',
      tokens: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
      },
    });
    expect(received).toEqual({ refreshToken: 'old-refresh' });
  });

  it('Refresh 쿠키가 없으면 백엔드를 부르지 않고 unauthenticated다', async () => {
    expect(await refreshSession(undefined)).toEqual({
      status: 'unauthenticated',
    });
  });

  it.each([401, 404])(
    '백엔드가 %i로 거부하면 unauthenticated다',
    async (status) => {
      server.use(
        http.post(`${API}/api/auth/refresh`, () =>
          HttpResponse.json(
            { code: 'EXPIRED_REFRESH_TOKEN', message: '만료', errors: [] },
            { status },
          ),
        ),
      );

      expect(await refreshSession('r')).toEqual({ status: 'unauthenticated' });
    },
  );

  it('백엔드 장애(5xx)와 연결 실패는 unavailable이다', async () => {
    server.use(
      http.post(
        `${API}/api/auth/refresh`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    expect(await refreshSession('r')).toEqual({ status: 'unavailable' });

    server.use(
      http.post(`${API}/api/auth/refresh`, () => HttpResponse.error()),
    );
    expect(await refreshSession('r')).toEqual({ status: 'unavailable' });
  });

  it('응답이 약속된 형식이 아니면 unavailable이다', async () => {
    server.use(
      http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json({ nope: 1 }),
      ),
    );

    expect(await refreshSession('r')).toEqual({ status: 'unavailable' });
  });
});

describe('refreshResponse', () => {
  const rejected = () =>
    errorResponse(401, 'UNAUTHORIZED', '인증이 필요합니다.');

  it('성공하면 로그인 상태와 새 쿠키 두 개를 돌려준다', async () => {
    const response = refreshResponse(
      {
        status: 'ok',
        tokens: { accessToken: 'a2', refreshToken: 'r2', expiresIn: 3600 },
      },
      rejected,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true });
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=a2`))).toBe(true);
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=r2`))).toBe(
      true,
    );
  });

  it('거부되면 호출한 쪽이 정한 응답에 쿠키 삭제를 붙인다', async () => {
    const response = refreshResponse({ status: 'unauthenticated' }, rejected);

    expect(response.status).toBe(401);
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    expect(cookies.every((c) => /Max-Age=0/i.test(c))).toBe(true);
  });

  it('장애면 502이고 쿠키는 건드리지 않는다', async () => {
    const response = refreshResponse({ status: 'unavailable' }, rejected);

    expect(response.status).toBe(502);
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
