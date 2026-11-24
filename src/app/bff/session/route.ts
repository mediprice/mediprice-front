import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { SESSION_PROBE_HEADER, SESSION_PROBE_VERSION } from '@/lib/api/paths';
import {
  clearSessionCookies,
  readTokens,
  setSessionCookies,
} from '@/server/bff/cookies';
import {
  clearLoginStateCookie,
  matchesLoginState,
} from '@/server/bff/login-state';
import { refreshSessionOnce } from '@/server/bff/refresh-coalescer';
import { refreshResponse } from '@/server/bff/refresh-session';
import { errorResponse, forbidden, jsonNoStore } from '@/server/bff/responses';
import { revokeSession } from '@/server/bff/revoke-session';
import { readSessionUser } from '@/server/bff/session-user';
import { isSameOrigin } from '@/server/bff/upstream';

const signInSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  loginState: z.string().min(1).max(256),
});

/** 로그인 직후 콜백 페이지가 넘긴 토큰을 httpOnly 쿠키로 바꿔 저장한다. 로그인 요청 확인 값 쿠키는 결과와 관계없이 지운다. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const response = await signIn(request);
  clearLoginStateCookie(response);
  return response;
}

/** 이 브라우저가 시작한 로그인(확인 값 일치)일 때만 세션을 만든다. */
async function signIn(request: NextRequest) {
  const parsed = signInSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(400, 'INVALID_INPUT', '잘못된 요청입니다.');
  }
  const { loginState, ...tokens } = parsed.data;
  if (!matchesLoginState(request, loginState)) {
    return errorResponse(
      403,
      'LOGIN_STATE_MISMATCH',
      '로그인 요청을 확인할 수 없습니다.',
    );
  }

  const response = jsonNoStore({ authenticated: true });
  setSessionCookies(response, tokens);
  return response;
}

/**
 * 재발급은 브라우저가 POST /bff/session/refresh 한 곳으로만 하게 해, API 401의 재발급과 겹쳐 같은 Refresh를 두 번 쓰지 않게 한다.
 * Access가 있으면 내 정보까지 읽어 함께 돌려준다. 읽지 못하면 user 없이 답하고 브라우저가 따로 읽는다.
 */
export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = readTokens(request);
  if (accessToken) {
    const user = await readSessionUser(accessToken, request.headers);
    return jsonNoStore(
      user ? { authenticated: true, user } : { authenticated: true },
    );
  }
  if (!refreshToken) return jsonNoStore({ authenticated: false });
  if (request.headers.get(SESSION_PROBE_HEADER) === SESSION_PROBE_VERSION) {
    return jsonNoStore({ authenticated: false, refreshable: true });
  }

  /** 배포 전 JS를 띄워 둔 탭 호환. 이 PR이 운영에 나간 다음 릴리스에서 이 분기와 표시 헤더 검사를 지운다. */
  const result = await refreshSessionOnce(refreshToken, request.headers);
  return refreshResponse(result, () => jsonNoStore({ authenticated: false }));
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
