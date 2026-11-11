import 'server-only';

import type { NextRequest } from 'next/server';

import { env } from '@/env';

import { unavailable } from './responses';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * `/bff/api/**` 경로를 백엔드 주소로 바꾼다. 이 서버가 임의의 주소로 요청을 보내는 통로가 되지 않도록
 * 항상 백엔드 호스트의 `/api/` 아래로만 만들고, 경로를 벗어나려는 시도는 `null`로 거부한다.
 */
export function resolveBackendUrl(segments: string[], search: string) {
  const [root, ...rest] = segments;
  if (root !== 'api' || rest.length === 0 || !rest.every(isSafeSegment)) {
    return null;
  }

  const url = new URL(env.NEXT_PUBLIC_API_URL);
  url.pathname = `/${segments.map(encodeURIComponent).join('/')}`;
  url.search = search;
  return url;
}

// 이미 한 번 디코딩된 값이므로 %가 남아 있으면 이중 인코딩이다. ykiho 등 정상 값에는 나오지 않는다.
function isSafeSegment(segment: string) {
  return (
    segment !== '' &&
    segment !== '.' &&
    segment !== '..' &&
    !/[/\\%]/.test(segment)
  );
}

/**
 * 상태를 바꾸는 요청은 우리 페이지에서 보낸 것만 받는다(CSRF 방어). 쿠키는 SameSite=Lax라 다른 사이트의
 * 폼 제출·fetch에는 실리지 않지만, 한 겹 더 막는다.
 */
export function isSameOrigin(request: NextRequest) {
  if (SAFE_METHODS.has(request.method)) return true;

  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** 백엔드로 보낼 헤더. 브라우저의 Cookie·Authorization은 버리고 쿠키의 Access로 Authorization을 만든다. */
export function forwardHeaders(incoming: Headers, accessToken?: string) {
  const headers = new Headers();
  for (const name of ['content-type', 'accept']) {
    const value = incoming.get(name);
    if (value) headers.set(name, value);
  }
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  return headers;
}

/** 백엔드를 호출한다. 연결에 실패하면 예외 대신 502 응답으로 바꿔 BFF 라우트가 그대로 돌려줄 수 있게 한다. */
export async function callBackend(url: URL, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    return unavailable();
  }
}
