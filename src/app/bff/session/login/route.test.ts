import { afterEach, describe, expect, it, vi } from 'vitest';

import { bffRequest } from '@/test/request';

import { GET } from './route';

afterEach(() => vi.unstubAllEnvs());

function loginStateCookieOf(response: Response) {
  return response.headers
    .getSetCookie()
    .find((c) => c.startsWith('mp_login_state='));
}

describe('GET /bff/session/login', () => {
  it('로그인 요청 확인 값을 쿠키에 심고 같은 값을 백엔드 로그인 주소에 넘긴다', () => {
    const response = GET(
      bffRequest('/bff/session/login?return_to=%2Fitems%2FA%3Fregion%3Dseoul'),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const location = new URL(response.headers.get('location') ?? '');
    expect(location.origin + location.pathname).toBe(
      'http://api.test/oauth2/authorization/google',
    );
    expect(location.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/oauth/callback',
    );
    expect(location.searchParams.get('return_to')).toBe(
      '/items/A?region=seoul',
    );

    const state = location.searchParams.get('login_state') ?? '';
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const cookie = loginStateCookieOf(response);
    expect(cookie).toContain(`mp_login_state=${state}`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\/bff(;|$)/);
    expect(cookie).toMatch(/Max-Age=600/);
  });

  it('요청마다 다른 값을 만든다', () => {
    const stateOf = (response: Response) =>
      new URL(response.headers.get('location') ?? '').searchParams.get(
        'login_state',
      );

    expect(stateOf(GET(bffRequest('/bff/session/login')))).not.toBe(
      stateOf(GET(bffRequest('/bff/session/login'))),
    );
  });

  it('안전하지 않은 돌아올 경로는 넘기지 않는다', () => {
    const response = GET(
      bffRequest('/bff/session/login?return_to=%2F%2Fevil.example'),
    );

    const location = new URL(response.headers.get('location') ?? '');
    expect(location.searchParams.has('return_to')).toBe(false);
  });

  it('운영에서는 Secure 쿠키다', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(loginStateCookieOf(GET(bffRequest('/bff/session/login')))).toMatch(
      /Secure/i,
    );
  });
});
