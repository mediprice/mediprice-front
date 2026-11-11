import { describe, expect, it } from 'vitest';

import { loginUrl, parseOAuthCallbackHash } from './oauth';

describe('loginUrl', () => {
  it('백엔드의 구글 로그인 시작 주소다', () => {
    expect(loginUrl()).toBe('http://api.test/oauth2/authorization/google');
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
    });
  });

  it.each(['', 'abc', '-1', '0', '1.5'])(
    '수명이 "%s"이면 INVALID_EXPIRES_IN이다',
    (expiresIn) => {
      expect(
        parseOAuthCallbackHash(
          `#accessToken=a&refreshToken=r&expiresIn=${expiresIn}`,
        ),
      ).toEqual({ ok: false, code: 'INVALID_EXPIRES_IN' });
    },
  );
});
