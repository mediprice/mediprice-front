import type { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { toApiError } from '@/lib/api/errors';
import { BFF_BASE } from '@/lib/api/paths';
import { getQueryClient } from '@/lib/query-client';

import { parseOAuthCallbackHash } from './oauth';

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
): Promise<{ ok: true } | { ok: false; code: string }> {
  const parsed = parseOAuthCallbackHash(hash);
  clearFragment();
  if (!parsed.ok) return parsed;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/session`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.tokens),
    });
  } catch {
    return { ok: false, code: 'NETWORK_ERROR' };
  }
  if (!response.ok) {
    return { ok: false, code: (await toApiError(response)).code };
  }
  queryClient.clear();
  return { ok: true };
}

const sessionSchema = z.object({ authenticated: z.boolean() });

export type SessionState = 'authenticated' | 'anonymous' | 'unavailable';

export async function getSession(baseUrl = BFF_BASE): Promise<SessionState> {
  try {
    const response = await fetch(`${baseUrl}/session`, {
      credentials: 'same-origin',
    });
    if (!response.ok) return 'unavailable';
    const parsed = sessionSchema.safeParse(await response.json());
    if (!parsed.success) return 'unavailable';
    return parsed.data.authenticated ? 'authenticated' : 'anonymous';
  } catch {
    return 'unavailable';
  }
}

/** 서버 요청이 실패해도 쿼리 캐시는 비운다. 이전 사용자의 데이터가 남으면 안 된다. */
export async function signOut(
  baseUrl = BFF_BASE,
  queryClient = getQueryClient(),
) {
  try {
    await fetch(`${baseUrl}/session`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {}
  queryClient.clear();
}
