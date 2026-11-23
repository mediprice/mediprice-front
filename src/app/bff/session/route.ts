import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  clearSessionCookies,
  readTokens,
  setSessionCookies,
} from '@/server/bff/cookies';
import { errorResponse, forbidden, jsonNoStore } from '@/server/bff/responses';
import { revokeSession } from '@/server/bff/revoke-session';
import { isSameOrigin } from '@/server/bff/upstream';

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

/** 재발급은 브라우저가 POST /bff/session/refresh 한 곳으로만 하게 해, API 401의 재발급과 겹쳐 같은 Refresh를 두 번 쓰지 않게 한다. */
export function GET(request: NextRequest) {
  const { accessToken, refreshToken } = readTokens(request);
  if (accessToken) return jsonNoStore({ authenticated: true });
  if (!refreshToken) return jsonNoStore({ authenticated: false });
  return jsonNoStore({ authenticated: false, refreshable: true });
}

/** 백엔드 폐기에 실패해도 이 브라우저의 쿠키는 지운다. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const { refreshToken } = readTokens(request);
  if (refreshToken) await revokeSession(refreshToken, request.headers);

  const response = new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
  clearSessionCookies(response);
  return response;
}
