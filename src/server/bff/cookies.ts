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

/** 접두사 없던 이전 이름의 쿠키. Refresh 수명(14일)이 지나면 이 이전 처리를 지운다. */
function hasLegacyNames() {
  return isSecure();
}

function expire(response: NextResponse, name: string, path: string) {
  response.cookies.set(name, '', { ...baseOptions(), path, maxAge: 0 });
}

function expireLegacy(response: NextResponse) {
  if (!hasLegacyNames()) return;
  expire(response, ACCESS_NAME, ACCESS_PATH);
  expire(response, REFRESH_NAME, REFRESH_PATH);
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
  expireLegacy(response);
}

/** 쿠키는 설정할 때와 같은 Path로 지워야 브라우저에서 실제로 삭제된다. */
export function clearSessionCookies(response: NextResponse) {
  const names = sessionCookieNames();
  expire(response, names.access, ACCESS_PATH);
  expire(response, names.refresh, REFRESH_PATH);
  expireLegacy(response);
}

/** 이전 이름의 Access는 읽지 않고, 이전 Refresh는 새 이름의 쿠키가 없을 때만 한 번 재발급해 새 이름으로 옮기는 데 쓴다. */
export function readTokens(request: NextRequest) {
  const names = sessionCookieNames();
  const legacyRefresh = hasLegacyNames()
    ? request.cookies.get(REFRESH_NAME)?.value
    : undefined;
  return {
    accessToken: request.cookies.get(names.access)?.value,
    refreshToken: request.cookies.get(names.refresh)?.value ?? legacyRefresh,
  };
}
