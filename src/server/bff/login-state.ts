import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import type { NextRequest, NextResponse } from 'next/server';

import { BFF_BASE } from '@/lib/api/paths';

/** 백엔드와 맞춘 계약: 32바이트 base64url, httpOnly, Path=/bff, SameSite=Lax, 10분. */
const LOGIN_STATE_COOKIE = 'mp_login_state';
const LOGIN_STATE_MAX_AGE_SECONDS = 10 * 60;

export function createLoginState() {
  return randomBytes(32).toString('base64url');
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: BFF_BASE,
    maxAge,
  } as const;
}

export function setLoginStateCookie(response: NextResponse, value: string) {
  response.cookies.set(
    LOGIN_STATE_COOKIE,
    value,
    cookieOptions(LOGIN_STATE_MAX_AGE_SECONDS),
  );
}

export function clearLoginStateCookie(response: NextResponse) {
  response.cookies.set(LOGIN_STATE_COOKIE, '', cookieOptions(0));
}

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

/** 길이가 달라도 같은 시간에 비교하도록 해시끼리 비교한다. 쿠키가 없으면 늘 불일치다. */
export function matchesLoginState(request: NextRequest, received: string) {
  const expected = request.cookies.get(LOGIN_STATE_COOKIE)?.value;
  if (!expected) return false;
  return timingSafeEqual(digest(expected), digest(received));
}
