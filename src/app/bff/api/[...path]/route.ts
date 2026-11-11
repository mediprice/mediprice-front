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

/**
 * 브라우저의 `/bff/api/**` 요청을 백엔드 `/api/**`로 중계한다. 쿠키의 Access Token을 `Authorization`으로
 * 바꿔 붙이므로 브라우저는 토큰을 알 필요가 없다. 만료(401)는 가공하지 않고 그대로 돌려준다. 재발급 여부는
 * 브라우저의 API 클라이언트가 판단해야 동시 요청의 재발급을 한 번으로 합칠 수 있다.
 */
async function relay(
  request: NextRequest,
  context: RouteContext<'/bff/api/[...path]'>,
) {
  if (!isSameOrigin(request)) return forbidden();

  const { path } = await context.params;
  // 라우트가 `/bff/api/` 뒤의 경로만 넘겨주므로 백엔드의 `/api/`를 다시 붙인다.
  const url = resolveBackendUrl(['api', ...path], request.nextUrl.search);
  if (!url) return errorResponse(404, 'NOT_FOUND', '존재하지 않는 경로입니다.');

  const upstream = await callBackend(url, {
    method: request.method,
    headers: forwardHeaders(request.headers, readTokens(request).accessToken),
    body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : request.body,
    // 요청 본문을 스트림으로 넘길 때 필요하다(Node의 fetch 요구사항).
    duplex: 'half',
    redirect: 'manual',
  } as RequestInit);

  // 상태 코드, 본문, Content-Type만 돌려준다. 백엔드의 Set-Cookie 등이 브라우저로 새지 않게 한다.
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
