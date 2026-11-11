import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ACCESS_COOKIE,
  clearSessionCookies,
  readTokens,
  REFRESH_COOKIE,
  setSessionCookies,
} from './cookies';

const tokens = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresIn: 3600,
};

afterEach(() => vi.unstubAllEnvs());

describe('setSessionCookies', () => {
  it('Access 쿠키는 expiresIn 동안 /bff에서만 보낸다', () => {
    const response = NextResponse.json({});
    setSessionCookies(response, tokens);

    expect(response.cookies.get(ACCESS_COOKIE)).toMatchObject({
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

    expect(response.cookies.get(REFRESH_COOKIE)).toMatchObject({
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
    expect(dev.cookies.get(ACCESS_COOKIE)?.secure).toBeFalsy();

    vi.stubEnv('NODE_ENV', 'production');
    const prod = NextResponse.json({});
    setSessionCookies(prod, tokens);
    expect(prod.cookies.get(ACCESS_COOKIE)?.secure).toBe(true);
    expect(prod.cookies.get(REFRESH_COOKIE)?.secure).toBe(true);
  });
});

describe('clearSessionCookies', () => {
  it('두 쿠키를 같은 Path로 즉시 만료시킨다', () => {
    const response = NextResponse.json({});
    clearSessionCookies(response);

    expect(response.cookies.get(ACCESS_COOKIE)).toMatchObject({
      value: '',
      path: '/bff',
      maxAge: 0,
    });
    expect(response.cookies.get(REFRESH_COOKIE)).toMatchObject({
      value: '',
      path: '/bff/session',
      maxAge: 0,
    });
  });
});

describe('readTokens', () => {
  it('요청의 쿠키에서 토큰을 읽는다', () => {
    const request = new NextRequest('http://localhost/bff/session', {
      headers: { cookie: `${ACCESS_COOKIE}=a1; ${REFRESH_COOKIE}=r1` },
    });

    expect(readTokens(request)).toEqual({
      accessToken: 'a1',
      refreshToken: 'r1',
    });
  });

  it('없는 쿠키는 undefined다', () => {
    const request = new NextRequest('http://localhost/bff/session');

    expect(readTokens(request)).toEqual({
      accessToken: undefined,
      refreshToken: undefined,
    });
  });
});
