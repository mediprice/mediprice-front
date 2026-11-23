import type { QueryClient } from '@tanstack/react-query';

import { toApiError } from '@/lib/api/errors';
import { BFF_BASE } from '@/lib/api/paths';
import { sharedRefresher } from '@/lib/api/refresh';
import { getQueryClient } from '@/lib/query-client';

import { parseOAuthCallbackHash } from './oauth';
import { markSignedOut } from './queries';

type CallbackOptions = {
  baseUrl?: string;
  clearFragment?: () => void;
  queryClient?: QueryClient;
};

function clearLocationFragment() {
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  );
}

/** 콜백의 토큰을 BFF에 한 번 넘겨 쿠키로 바꾸고 쿼리 캐시를 비운다. 성공·실패와 관계없이 먼저 주소창의 fragment를 지운다. */
export async function completeOAuthCallback(
  hash: string,
  {
    baseUrl = BFF_BASE,
    clearFragment = clearLocationFragment,
    queryClient = getQueryClient(),
  }: CallbackOptions = {},
): Promise<
  | { ok: true; returnTo: string | null }
  | { ok: false; code: string; returnTo: string | null }
> {
  const parsed = parseOAuthCallbackHash(hash);
  clearFragment();
  if (!parsed.ok) return parsed;
  const { returnTo } = parsed;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/session`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.tokens),
    });
  } catch {
    return { ok: false, code: 'NETWORK_ERROR', returnTo };
  }
  if (!response.ok) {
    return {
      ok: false,
      code: (await toApiError(response)).code,
      returnTo,
    };
  }
  queryClient.clear();
  return { ok: true, returnTo };
}

/** 서버 요청이 실패해도 쿼리 캐시는 비운다. 진행 중인 재발급이 끝난 뒤 보내고 그동안 새 재발급을 막아야, 재발급 응답이 지운 쿠키를 다시 심지 않는다. */
export async function signOut(
  baseUrl = BFF_BASE,
  queryClient = getQueryClient(),
) {
  await sharedRefresher(baseUrl).pausedDuring(async () => {
    try {
      await fetch(`${baseUrl}/session`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
    } catch {}
    markSignedOut(queryClient);
  });
}
