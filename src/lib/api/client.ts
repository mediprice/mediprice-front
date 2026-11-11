import createClient from 'openapi-fetch';

import { emitSessionExpired } from '@/lib/auth/events';

import { serializeQuery } from './query';
import { createRefresher } from './refresh';
import type { paths } from './schema';

type Options = {
  /** BFF 주소. 브라우저에서는 같은 출처의 `/bff`다. */
  baseUrl: string;
  /** Refresh까지 거부되어 다시 로그인해야 할 때 한 번 호출된다. */
  onSessionExpired?: () => void;
  refresh?: ReturnType<typeof createRefresher>;
};

/**
 * 401을 받으면 재발급을 거친 뒤 같은 요청을 한 번만 다시 보내는 fetch.
 *
 * 토큰은 httpOnly 쿠키에 있어 여기서는 다룰 수 없다. 브라우저가 쿠키를 자동으로 보내고 BFF가 갱신된
 * 쿠키를 설정하므로, 재발급이 끝나면 같은 요청을 다시 보내기만 하면 된다.
 */
export function createApiFetch({
  baseUrl,
  onSessionExpired,
  refresh = createRefresher(baseUrl),
}: Options) {
  return async function apiFetch(input: Request) {
    // 본문은 한 번만 읽을 수 있으므로 보내기 전에 재시도용 복사본을 만들어 둔다.
    const retry = input.clone();
    const response = await fetch(input);

    if (response.status !== 401 || isSessionRequest(input.url, baseUrl)) {
      return response;
    }

    const outcome = await refresh();
    if (outcome === 'ok') return fetch(retry);
    // 장애로 재발급하지 못한 것은 로그아웃 사유가 아니다. 원래 응답만 돌려준다.
    if (outcome === 'unauthenticated') onSessionExpired?.();
    return response;
  };
}

// 세션 요청의 401은 "로그인하지 않음"이라는 답이다. 여기서 재발급을 다시 부르면 끝나지 않는다.
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

/** 앱에서 쓰는 API 클라이언트. 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const apiClient = createApiClient({
  baseUrl: '/bff',
  onSessionExpired: emitSessionExpired,
});
