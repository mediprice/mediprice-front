import 'server-only';

import { NextResponse } from 'next/server';

const NO_STORE = { 'Cache-Control': 'no-store' };

export function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function errorResponse(status: number, code: string, message: string) {
  return jsonNoStore({ code, message, errors: [] }, status);
}

export const forbidden = () =>
  errorResponse(403, 'ACCESS_DENIED', '허용되지 않은 요청입니다.');

export const unavailable = () =>
  errorResponse(502, 'UPSTREAM_UNAVAILABLE', '서버에 연결할 수 없습니다.');

export const gatewayTimeout = () =>
  errorResponse(504, 'UPSTREAM_TIMEOUT', '서버 응답이 지연되고 있습니다.');

export const unauthenticated = () =>
  errorResponse(401, 'UNAUTHORIZED', '인증이 필요합니다.');
