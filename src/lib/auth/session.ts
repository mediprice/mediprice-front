import { toApiError } from '@/lib/api/errors';
import { getQueryClient } from '@/lib/query-client';

import { parseOAuthCallbackHash } from './oauth';

const BFF = '/bff';

type CallbackOptions = {
  baseUrl?: string;
  /** 주소창에서 fragment를 지운다. 기본은 현재 경로와 쿼리만 남기고 교체한다. */
  clearFragment?: () => void;
};

function clearLocationFragment() {
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  );
}

/**
 * OAuth 콜백 페이지가 호출한다. fragment의 토큰을 BFF에 한 번 넘겨 httpOnly 쿠키로 바꾸고, 주소창에서
 * 토큰을 지운다. 이 순간을 빼면 토큰은 JavaScript가 접근할 수 있는 곳에 남지 않는다.
 */
export async function completeOAuthCallback(
  hash: string,
  {
    baseUrl = BFF,
    clearFragment = clearLocationFragment,
  }: CallbackOptions = {},
): Promise<{ ok: true } | { ok: false; code: string }> {
  const parsed = parseOAuthCallbackHash(hash);
  // 성공이든 실패든 토큰이 주소창·방문 기록에 남지 않도록 먼저 지운다.
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
  return { ok: true };
}

export type SessionState = 'authenticated' | 'anonymous' | 'unavailable';

/** 로그인 여부. 새로고침 직후에는 BFF가 Refresh로 조용히 이어 준다. */
export async function getSession(baseUrl = BFF): Promise<SessionState> {
  try {
    const response = await fetch(`${baseUrl}/session`, {
      credentials: 'same-origin',
    });
    if (!response.ok) return 'unavailable';
    const body = (await response.json()) as { authenticated?: boolean };
    return body.authenticated ? 'authenticated' : 'anonymous';
  } catch {
    return 'unavailable';
  }
}

/** 로그아웃. 서버 요청이 실패해도 이 브라우저의 캐시는 비워 이전 사용자의 데이터가 남지 않게 한다. */
export async function signOut(baseUrl = BFF) {
  try {
    await fetch(`${baseUrl}/session`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {
    // 쿠키는 BFF가 지운다. 연결 실패 시 남은 쿠키는 만료로 사라진다.
  }
  getQueryClient().clear();
}
