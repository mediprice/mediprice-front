import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearSessionCookies,
  readTokens,
  sessionCookieNames,
  setSessionCookies,
} from './cookies';

const tokens = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresIn: 3600,
};

afterEach(() => vi.unstubAllEnvs());

function requestWith(cookie?: string) {
  return new NextRequest('http://localhost/bff/session', {
    headers: cookie ? { cookie } : {},
  });
}

describe('sessionCookieNames', () => {
  it('운영에서는 __Secure- 접두사를 붙인다', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(sessionCookieNames()).toEqual({
      access: '__Secure-mp_access',
      refresh: '__Secure-mp_refresh',
    });
  });

  it('로컬 http에서는 접두사 없이 쓴다', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(sessionCookieNames()).toEqual({
      access: 'mp_access',
      refresh: 'mp_refresh',
    });
  });
});

describe('setSessionCookies', () => {
  it('Access 쿠키는 expiresIn 동안 /bff에서만 보낸다', () => {
    const response = NextResponse.json({});
    setSessionCookies(response, tokens);

    expect(response.cookies.get(sessionCookieNames().access)).toMatchObject({
      value: 'access-1',
      httpOnly: true,
      sameSite: 'lax',
      path: '/bff',
      maxAge: 3600,
    });
  });

  it('Refresh 쿠키는 14일 동안 /bff/session에서만 보낸다', () => {
    const response = NextResponse.json({});
    setSessionCookies(response, tokens);

    expect(response.cookies.get(sessionCookieNames().refresh)).toMatchObject({
      value: 'refresh-1',
      httpOnly: true,
      sameSite: 'lax',
      path: '/bff/session',
      maxAge: 14 * 24 * 60 * 60,
    });
  });

  it('운영에서만 Secure를 붙인다', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const dev = NextResponse.json({});
    setSessionCookies(dev, tokens);
    expect(dev.cookies.get('mp_access')?.secure).toBeFalsy();

    vi.stubEnv('NODE_ENV', 'production');
    const prod = NextResponse.json({});
    setSessionCookies(prod, tokens);
    expect(prod.cookies.get('__Secure-mp_access')?.secure).toBe(true);
    expect(prod.cookies.get('__Secure-mp_refresh')?.secure).toBe(true);
  });

  it('운영에서는 접두사 없던 이전 쿠키를 같은 Path로 지운다', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = NextResponse.json({});
    setSessionCookies(response, tokens);

    expect(response.cookies.get('mp_access')).toMatchObject({
      value: '',
      path: '/bff',
      maxAge: 0,
    });
    expect(response.cookies.get('mp_refresh')).toMatchObject({
      value: '',
      path: '/bff/session',
      maxAge: 0,
    });
  });

  it('로컬에서는 이전 이름이 지금 이름이라 지우지 않는다', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const response = NextResponse.json({});
    setSessionCookies(response, tokens);

    expect(response.cookies.get('mp_access')?.value).toBe('access-1');
    expect(response.headers.getSetCookie()).toHaveLength(2);
  });
});

describe('clearSessionCookies', () => {
  it('두 쿠키를 같은 Path로 즉시 만료시킨다', () => {
    const response = NextResponse.json({});
    clearSessionCookies(response);

    expect(response.cookies.get(sessionCookieNames().access)).toMatchObject({
      value: '',
      path: '/bff',
      maxAge: 0,
    });
    expect(response.cookies.get(sessionCookieNames().refresh)).toMatchObject({
      value: '',
      path: '/bff/session',
      maxAge: 0,
    });
  });

  it('운영에서는 이전 이름의 쿠키도 함께 지운다', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = NextResponse.json({});
    clearSessionCookies(response);

    const cleared = response.headers
      .getSetCookie()
      .map((cookie) => cookie.split('=')[0]);
    expect(cleared).toEqual(
      expect.arrayContaining([
        '__Secure-mp_access',
        '__Secure-mp_refresh',
        'mp_access',
        'mp_refresh',
      ]),
    );
  });
});

describe('readTokens', () => {
  it('요청의 쿠키에서 토큰을 읽는다', () => {
    const { access, refresh } = sessionCookieNames();

    expect(readTokens(requestWith(`${access}=a1; ${refresh}=r1`))).toEqual({
      accessToken: 'a1',
      refreshToken: 'r1',
    });
  });

  it('없는 쿠키는 undefined다', () => {
    expect(readTokens(requestWith())).toEqual({
      accessToken: undefined,
      refreshToken: undefined,
    });
  });

  describe('운영에서 이전 이름의 쿠키', () => {
    it('Access는 읽지 않고 Refresh는 재발급에 쓴다', () => {
      vi.stubEnv('NODE_ENV', 'production');

      expect(readTokens(requestWith('mp_access=a0; mp_refresh=r0'))).toEqual({
        accessToken: undefined,
        refreshToken: 'r0',
      });
    });

    it('새 이름의 Refresh가 있으면 그쪽을 쓴다', () => {
      vi.stubEnv('NODE_ENV', 'production');

      expect(
        readTokens(requestWith('mp_refresh=r0; __Secure-mp_refresh=r1'))
          .refreshToken,
      ).toBe('r1');
    });
  });
});
