import 'server-only';

import { NextResponse } from 'next/server';

// 세션 응답은 사용자마다 다르므로 어떤 캐시도 저장하지 않게 한다.
const NO_STORE = { 'Cache-Control': 'no-store' };

export function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** 백엔드와 같은 `{code, message, errors}` 형식이라 클라이언트가 같은 방식으로 해석한다. */
export function errorResponse(status: number, code: string, message: string) {
  return jsonNoStore({ code, message, errors: [] }, status);
}

export const forbidden = () =>
  errorResponse(403, 'ACCESS_DENIED', '허용되지 않은 요청입니다.');

export const unavailable = () =>
  errorResponse(502, 'UPSTREAM_UNAVAILABLE', '서버에 연결할 수 없습니다.');

export const unauthenticated = () =>
  errorResponse(401, 'UNAUTHORIZED', '인증이 필요합니다.');
