import 'server-only';

import type { NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '@/env';

import type { Tokens } from './cookies';
import { clearSessionCookies, setSessionCookies } from './cookies';
import { jsonNoStore, unavailable } from './responses';
import { callBackend } from './upstream';

const tokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export type RefreshResult =
  | { status: 'ok'; tokens: Tokens }
  /** Refresh가 없거나 백엔드가 거부했다. 다시 로그인해야 한다. */
  | { status: 'unauthenticated' }
  /** 백엔드 장애나 연결 실패. 토큰이 유효한지 알 수 없으므로 쿠키를 지우면 안 된다. */
  | { status: 'unavailable' };

/** 백엔드는 재발급마다 두 토큰을 모두 새로 내리므로 호출하는 쪽이 두 쿠키를 함께 교체해야 한다. */
export async function refreshSession(
  refreshToken: string | undefined,
): Promise<RefreshResult> {
  if (!refreshToken) return { status: 'unauthenticated' };

  const response = await callBackend(
    new URL('/api/auth/refresh', env.NEXT_PUBLIC_API_URL),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    },
  );

  if (response.status >= 400 && response.status < 500) {
    return { status: 'unauthenticated' };
  }
  if (!response.ok) return { status: 'unavailable' };

  const parsed = tokenResponseSchema.safeParse(
    await response.json().catch(() => null),
  );
  return parsed.success
    ? { status: 'ok', tokens: parsed.data }
    : { status: 'unavailable' };
}

/** 장애일 때 쿠키를 지우면 일시적인 오류로 사용자가 로그아웃되므로 지우지 않는다. */
export function refreshResponse(
  result: RefreshResult,
  rejected: () => NextResponse,
) {
  if (result.status === 'ok') {
    const response = jsonNoStore({ authenticated: true });
    setSessionCookies(response, result.tokens);
    return response;
  }
  if (result.status === 'unauthenticated') {
    const response = rejected();
    clearSessionCookies(response);
    return response;
  }
  return unavailable();
}
