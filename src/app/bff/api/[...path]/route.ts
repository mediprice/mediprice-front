import type { NextRequest } from 'next/server';

import { readTokens } from '@/server/bff/cookies';
import { errorResponse, forbidden } from '@/server/bff/responses';
import {
  callBackend,
  forwardHeaders,
  isSameOrigin,
  resolveBackendUrl,
} from '@/server/bff/upstream';

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);

/** Node의 fetch가 스트림 본문에 요구하는 옵션이라 TS 기본 타입에 없다. */
type StreamingInit = RequestInit & { duplex: 'half' };

/** 백엔드 응답은 상태·본문·Content-Type만 돌려주고(Set-Cookie 등 제외), 401도 가공하지 않는다. */
async function relay(
  request: NextRequest,
  context: RouteContext<'/bff/api/[...path]'>,
) {
  if (!isSameOrigin(request)) return forbidden();

  const { path } = await context.params;
  const backendPath = ['api', ...path];
  const url = resolveBackendUrl(backendPath, request.nextUrl.search);
  if (!url) return errorResponse(404, 'NOT_FOUND', '존재하지 않는 경로입니다.');

  const init: StreamingInit = {
    method: request.method,
    headers: forwardHeaders(request.headers, readTokens(request).accessToken),
    body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : request.body,
    duplex: 'half',
    redirect: 'manual',
  };
  const upstream = await callBackend(url, init);

  const headers = new Headers({ 'Cache-Control': 'no-store' });
  const contentType = upstream.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  return new Response(upstream.body, { status: upstream.status, headers });
}

export {
  relay as DELETE,
  relay as GET,
  relay as PATCH,
  relay as POST,
  relay as PUT,
};
