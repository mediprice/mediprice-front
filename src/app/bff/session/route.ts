import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '@/env';
import {
  clearSessionCookies,
  readTokens,
  setSessionCookies,
} from '@/server/bff/cookies';
import { refreshResponse, refreshSession } from '@/server/bff/refresh-session';
import { errorResponse, forbidden, jsonNoStore } from '@/server/bff/responses';
import { callBackend, isSameOrigin } from '@/server/bff/upstream';

const signInSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

/** 로그인 직후 콜백 페이지가 넘긴 토큰을 httpOnly 쿠키로 바꿔 저장한다. */
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

/** Access가 만료돼도 Refresh가 있으면 재발급해서 로그인을 이어 간다. */
export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = readTokens(request);
  if (accessToken) return jsonNoStore({ authenticated: true });
  if (!refreshToken) return jsonNoStore({ authenticated: false });

  const result = await refreshSession(refreshToken);
  return refreshResponse(result, () => jsonNoStore({ authenticated: false }));
}

/** 백엔드 폐기에 실패해도 이 브라우저의 쿠키는 지운다. */
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
