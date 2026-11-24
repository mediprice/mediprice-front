import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';

import { BFF_BASE } from '@/lib/api/paths';

const ACCESS_NAME = 'mp_access';
const REFRESH_NAME = 'mp_refresh';

/** 백엔드 Refresh Token의 수명(14일). 백엔드가 응답으로 알려주지 않아 상수로 맞춘다. */
const REFRESH_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

/** Access는 /bff 전체에, Refresh는 세션 경로로만 보내 일반 API 요청에 실리지 않게 한다. */
const ACCESS_PATH = BFF_BASE;
const REFRESH_PATH = `${BFF_BASE}/session`;

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  /** Access Token의 남은 수명(초) */
  expiresIn: number;
};

/** 로컬(http)에서는 Secure 쿠키가 저장되지 않으므로 운영에서만 Secure를 붙인다. */
function isSecure() {
  return process.env.NODE_ENV === 'production';
}

/** __Secure- 접두사는 Secure 쿠키에만 붙일 수 있어 로컬 http에서는 접두사 없이 쓴다. Path를 /bff로 좁혀 두어 __Host-는 쓸 수 없다. */
export function sessionCookieNames() {
  const prefix = isSecure() ? '__Secure-' : '';
  return {
    access: `${prefix}${ACCESS_NAME}`,
    refresh: `${prefix}${REFRESH_NAME}`,
  };
}

function baseOptions() {
  return { httpOnly: true, sameSite: 'lax', secure: isSecure() } as const;
}

function expire(response: NextResponse, name: string, path: string) {
  response.cookies.set(name, '', { ...baseOptions(), path, maxAge: 0 });
}

export function setSessionCookies(response: NextResponse, tokens: Tokens) {
  const names = sessionCookieNames();
  response.cookies.set(names.access, tokens.accessToken, {
    ...baseOptions(),
    path: ACCESS_PATH,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(names.refresh, tokens.refreshToken, {
    ...baseOptions(),
    path: REFRESH_PATH,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

/** 쿠키는 설정할 때와 같은 Path로 지워야 브라우저에서 실제로 삭제된다. */
export function clearSessionCookies(response: NextResponse) {
  const names = sessionCookieNames();
  expire(response, names.access, ACCESS_PATH);
  expire(response, names.refresh, REFRESH_PATH);
}

export function readTokens(request: NextRequest) {
  const names = sessionCookieNames();
  return {
    accessToken: request.cookies.get(names.access)?.value,
    refreshToken: request.cookies.get(names.refresh)?.value,
  };
}
