import { describe, expect, it } from 'vitest';

import { loginUrl, parseOAuthCallbackHash } from './oauth';

describe('loginUrl', () => {
  it('백엔드의 구글 로그인 시작 주소다', () => {
    expect(loginUrl()).toBe('http://api.test/oauth2/authorization/google');
  });

  it('이 앱의 콜백 주소와 돌아올 경로를 넘긴다', () => {
    const url = new URL(
      loginUrl({
        origin: 'http://localhost:3000',
        returnTo: '/items/A?region=seoul',
      }),
    );

    expect(url.origin + url.pathname).toBe(
      'http://api.test/oauth2/authorization/google',
    );
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/oauth/callback',
    );
    expect(url.searchParams.get('return_to')).toBe('/items/A?region=seoul');
  });

  it.each([
    'https://evil.example/x',
    '//evil.example',
    '/\\evil',
    `/${'a'.repeat(512)}`,
  ])('안전하지 않은 돌아올 경로(%s)는 넘기지 않는다', (returnTo) => {
    const url = new URL(
      loginUrl({ origin: 'http://localhost:3000', returnTo }),
    );

    expect(url.searchParams.has('return_to')).toBe(false);
    expect(url.searchParams.has('redirect_uri')).toBe(true);
  });
});

describe('parseOAuthCallbackHash', () => {
  it('토큰을 읽는다', () => {
    expect(
      parseOAuthCallbackHash(
        '#accessToken=a.b.c&refreshToken=r%2B1&expiresIn=3600',
      ),
    ).toEqual({
      ok: true,
      tokens: { accessToken: 'a.b.c', refreshToken: 'r+1', expiresIn: 3600 },
      returnTo: null,
    });
  });

  it('# 없이도 읽는다', () => {
    expect(
      parseOAuthCallbackHash('accessToken=a&refreshToken=r&expiresIn=60'),
    ).toMatchObject({ ok: true });
  });

  it('백엔드가 보낸 에러 코드를 돌려준다', () => {
    expect(parseOAuthCallbackHash('#error=OAUTH2_LOGIN_FAILED')).toEqual({
      ok: false,
      code: 'OAUTH2_LOGIN_FAILED',
      returnTo: null,
    });
  });

  it.each([
    ['빈 값', ''],
    ['# 만', '#'],
    ['Access 누락', '#refreshToken=r&expiresIn=60'],
    ['Refresh 누락', '#accessToken=a&expiresIn=60'],
    ['빈 토큰', '#accessToken=&refreshToken=r&expiresIn=60'],
  ])('%s이면 MISSING_TOKENS다', (_name, hash) => {
    expect(parseOAuthCallbackHash(hash)).toEqual({
      ok: false,
      code: 'MISSING_TOKENS',
      returnTo: null,
    });
  });

  it.each(['', 'abc', '-1', '0', '1.5'])(
    '수명이 "%s"이면 INVALID_EXPIRES_IN이다',
    (expiresIn) => {
      expect(
        parseOAuthCallbackHash(
          `#accessToken=a&refreshToken=r&expiresIn=${expiresIn}`,
        ),
      ).toEqual({ ok: false, code: 'INVALID_EXPIRES_IN', returnTo: null });
    },
  );

  it('성공과 실패 모두 돌아올 경로를 읽는다', () => {
    const returnTo = encodeURIComponent('/items/A?region=seoul');

    expect(
      parseOAuthCallbackHash(
        `#accessToken=a&refreshToken=r&expiresIn=60&returnTo=${returnTo}`,
      ),
    ).toMatchObject({ ok: true, returnTo: '/items/A?region=seoul' });
    expect(
      parseOAuthCallbackHash(`#error=access_denied&returnTo=${returnTo}`),
    ).toEqual({
      ok: false,
      code: 'access_denied',
      returnTo: '/items/A?region=seoul',
    });
  });

  it.each([
    'https%3A%2F%2Fevil.example',
    '%2F%2Fevil.example',
    '%2F%5Cevil.example',
    '%2Foauth%2Fcallback',
  ])('안전하지 않은 돌아올 경로(%s)는 버린다', (returnTo) => {
    expect(
      parseOAuthCallbackHash(
        `#accessToken=a&refreshToken=r&expiresIn=60&returnTo=${returnTo}`,
      ),
    ).toMatchObject({ ok: true, returnTo: null });
  });
});
