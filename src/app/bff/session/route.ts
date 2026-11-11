import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '@/env';
import {
  clearSessionCookies,
  readTokens,
  setSessionCookies,
} from '@/server/bff/cookies';
import { refreshSession } from '@/server/bff/refresh-session';
import {
  errorResponse,
  forbidden,
  jsonNoStore,
  unavailable,
} from '@/server/bff/responses';
import { callBackend, isSameOrigin } from '@/server/bff/upstream';

const signInSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

/**
 * 로그인 직후 콜백 페이지가 URL fragment에서 읽은 토큰을 한 번 넘기면 httpOnly 쿠키로 바꿔 저장한다.
 * 이후 토큰은 브라우저의 JavaScript가 읽을 수 없다.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const parsed = signInSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(400, 'INVALID_INPUT', '잘못된 요청입니다.');
  }

  const response = jsonNoStore({ authenticated: true });
  setSessionCookies(response, parsed.data);
  return response;
}

/**
 * 로그인 여부를 알려준다. Access가 만료돼 쿠키에서 사라졌어도 Refresh가 있으면 재발급해서 이어 간다
 * (새로고침 직후 로그인이 풀리지 않게 하려는 것이다).
 */
export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = readTokens(request);
  if (accessToken) return jsonNoStore({ authenticated: true });
  if (!refreshToken) return jsonNoStore({ authenticated: false });

  const result = await refreshSession(refreshToken);
  if (result.status === 'ok') {
    const response = jsonNoStore({ authenticated: true });
    setSessionCookies(response, result.tokens);
    return response;
  }
  if (result.status === 'unauthenticated') {
    const response = jsonNoStore({ authenticated: false });
    clearSessionCookies(response);
    return response;
  }
  return unavailable();
}

/** 로그아웃. 백엔드에 Refresh 폐기를 알리지 못해도 이 브라우저의 쿠키는 반드시 지운다. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const { refreshToken } = readTokens(request);
  if (refreshToken) {
    await callBackend(new URL('/api/auth/logout', env.NEXT_PUBLIC_API_URL), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  }

  const response = new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
  clearSessionCookies(response);
  return response;
}
