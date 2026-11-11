import type { NextRequest, NextResponse } from 'next/server';

export const ACCESS_COOKIE = 'mp_access';
export const REFRESH_COOKIE = 'mp_refresh';

/** 백엔드 Refresh Token의 수명(14일). 백엔드가 응답으로 알려주지 않아 상수로 맞춘다. */
const REFRESH_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

// Access는 API 중계 요청(/bff/api)에만, Refresh는 세션 경로(/bff/session)에서만 전송되도록 Path를 나눈다.
// Refresh가 일반 API 요청에 실려 다니지 않게 하려는 것이다.
const ACCESS_PATH = '/bff';
const REFRESH_PATH = '/bff/session';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  /** Access Token의 남은 수명(초) */
  expiresIn: number;
};

// 요청 시점의 NODE_ENV를 읽는다. 로컬(http)에서는 Secure 쿠키가 저장되지 않기 때문이다.
function baseOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  } as const;
}

export function setSessionCookies(response: NextResponse, tokens: Tokens) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    path: ACCESS_PATH,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    path: REFRESH_PATH,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

/** 쿠키는 설정할 때와 같은 Path로 지워야 브라우저에서 실제로 삭제된다. */
export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', {
    ...baseOptions(),
    path: ACCESS_PATH,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, '', {
    ...baseOptions(),
    path: REFRESH_PATH,
    maxAge: 0,
  });
}

export function readTokens(request: NextRequest) {
  return {
    accessToken: request.cookies.get(ACCESS_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_COOKIE)?.value,
  };
}
