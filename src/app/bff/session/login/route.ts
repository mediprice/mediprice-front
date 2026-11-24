import { type NextRequest, NextResponse } from 'next/server';

import { loginUrl } from '@/features/auth/oauth';
import {
  createLoginState,
  setLoginStateCookie,
} from '@/server/bff/login-state';

/** 로그인 요청 확인 값을 쿠키에 심고 백엔드의 구글 로그인으로 보낸다. 콜백은 이 브라우저가 시작한 로그인일 때만 세션을 만든다. */
export function GET(request: NextRequest) {
  const loginState = createLoginState();
  const response = NextResponse.redirect(
    loginUrl({
      origin: request.nextUrl.origin,
      returnTo: request.nextUrl.searchParams.get('return_to'),
      loginState,
    }),
    303,
  );
  response.headers.set('Cache-Control', 'no-store');
  setLoginStateCookie(response, loginState);
  return response;
}
