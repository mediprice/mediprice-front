import 'server-only';

import { env } from '@/env';

import { callBackend, forwardHeaders } from './upstream';

/** 세션 확인을 오래 붙잡지 않는다. 늦으면 브라우저가 내 정보를 따로 읽는다. */
const SESSION_USER_TIMEOUT_MS = 5_000;

/**
 * 세션 확인과 같은 왕복에서 내 정보를 읽는다. 401·장애·시간 초과면 null이라
 * 브라우저가 예전처럼 /bff/api/users/me로 읽는다(401이면 그쪽에서 재발급한다).
 */
export async function readSessionUser(accessToken: string, incoming: Headers) {
  const headers = forwardHeaders(incoming, accessToken);
  headers.set('accept', 'application/json');
  const response = await callBackend(
    new URL('/api/users/me', env.NEXT_PUBLIC_API_URL),
    {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(SESSION_USER_TIMEOUT_MS),
    },
  );
  if (!response.ok) return null;
  try {
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null ? body : null;
  } catch {
    return null;
  }
}
