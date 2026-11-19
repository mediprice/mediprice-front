import { env } from '@/env';

import { sanitizeReturnPath } from './return-path';

const CALLBACK_PATH = '/oauth/callback';

/** 백엔드의 구글 로그인 시작 주소. 백엔드가 허용한 출처면 이 앱의 콜백으로, 안전한 return_to면 그 경로로 돌려보낸다(모르는 값은 백엔드가 무시한다). */
export function loginUrl({
  origin,
  returnTo,
}: { origin?: string; returnTo?: string | null } = {}) {
  const url = new URL('/oauth2/authorization/google', env.NEXT_PUBLIC_API_URL);
  if (origin) {
    url.searchParams.set('redirect_uri', new URL(CALLBACK_PATH, origin).href);
  }
  const safeReturnTo = sanitizeReturnPath(returnTo);
  if (safeReturnTo) url.searchParams.set('return_to', safeReturnTo);
  return url.href;
}

type CallbackTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

/** returnTo는 백엔드가 fragment로 돌려준 경로를 다시 검증한 값이다. 없거나 안전하지 않으면 null이다. */
export type CallbackResult =
  | { ok: true; tokens: CallbackTokens; returnTo: string | null }
  | { ok: false; code: string; returnTo: string | null };

/** 콜백 주소의 fragment(`#accessToken=…` 또는 `#error=…`)를 해석한다. */
export function parseOAuthCallbackHash(hash: string): CallbackResult {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const returnTo = sanitizeReturnPath(params.get('returnTo'));

  const error = params.get('error');
  if (error) return { ok: false, code: error, returnTo };

  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  if (!accessToken || !refreshToken) {
    return { ok: false, code: 'MISSING_TOKENS', returnTo };
  }

  const expiresIn = Number(params.get('expiresIn'));
  if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
    return { ok: false, code: 'INVALID_EXPIRES_IN', returnTo };
  }

  return {
    ok: true,
    tokens: { accessToken, refreshToken, expiresIn },
    returnTo,
  };
}
