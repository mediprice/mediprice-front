import type { NextRequest } from 'next/server';

import {
  clearSessionCookies,
  readTokens,
  setSessionCookies,
} from '@/server/bff/cookies';
import { refreshSession } from '@/server/bff/refresh-session';
import {
  forbidden,
  jsonNoStore,
  unauthenticated,
  unavailable,
} from '@/server/bff/responses';
import { isSameOrigin } from '@/server/bff/upstream';

/**
 * 쿠키의 Refresh Token으로 두 토큰을 새로 받아 쿠키를 교체한다. 브라우저의 API 클라이언트가 401을 받았을 때
 * 부르며, 동시에 여러 번 호출되지 않도록 클라이언트 쪽에서 하나로 합친다.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();

  const result = await refreshSession(readTokens(request).refreshToken);

  if (result.status === 'ok') {
    const response = jsonNoStore({ authenticated: true });
    setSessionCookies(response, result.tokens);
    return response;
  }
  if (result.status === 'unauthenticated') {
    const response = unauthenticated();
    clearSessionCookies(response);
    return response;
  }
  // 백엔드 장애일 때 쿠키를 지우면 일시적인 오류로 사용자가 로그아웃된다.
  return unavailable();
}
