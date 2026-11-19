import createClient from 'openapi-fetch';

import { emitSessionExpired } from '@/lib/api/session-events';

import { BFF_BASE } from './paths';
import { serializeQuery } from './query';
import { createRefresher } from './refresh';
import type { paths } from './schema';

type Options = {
  baseUrl: string;
  onSessionExpired?: () => void;
  refresh?: ReturnType<typeof createRefresher>;
};

/** 401이면 재발급을 거쳐 같은 요청을 한 번만 다시 보낸다. */
export function createApiFetch({
  baseUrl,
  onSessionExpired,
  refresh = createRefresher(baseUrl),
}: Options) {
  return async function apiFetch(input: Request) {
    const retry = input.clone();
    const response = await fetch(input);

    if (response.status !== 401 || isSessionRequest(input.url, baseUrl)) {
      return response;
    }

    const outcome = await refresh();
    if (outcome === 'ok') return fetch(retry);
    if (outcome === 'unauthenticated') onSessionExpired?.();
    return response;
  };
}

/** 세션 요청의 401은 "로그인 안 함"이라는 답이므로 재발급하지 않는다. */
function isSessionRequest(url: string, baseUrl: string) {
  const sessionPath = new URL(`${baseUrl}/session`, url).pathname;
  return new URL(url).pathname.startsWith(sessionPath);
}

export function createApiClient(options: Options) {
  return createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: createApiFetch(options),
    querySerializer: serializeQuery,
  });
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const apiClient = createApiClient({
  baseUrl: BFF_BASE,
  onSessionExpired: emitSessionExpired,
});
