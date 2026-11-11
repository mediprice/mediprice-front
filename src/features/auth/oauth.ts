import { env } from '@/env';

/** 백엔드의 구글 로그인 시작 주소. */
export function loginUrl() {
  return new URL('/oauth2/authorization/google', env.NEXT_PUBLIC_API_URL).href;
}

type CallbackTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type CallbackResult =
  { ok: true; tokens: CallbackTokens } | { ok: false; code: string };

/** 콜백 주소의 fragment(`#accessToken=…` 또는 `#error=…`)를 해석한다. */
export function parseOAuthCallbackHash(hash: string): CallbackResult {
  const params = new URLSearchParams(hash.replace(/^#/, ''));

  const error = params.get('error');
  if (error) return { ok: false, code: error };

  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  if (!accessToken || !refreshToken) {
    return { ok: false, code: 'MISSING_TOKENS' };
  }

  const expiresIn = Number(params.get('expiresIn'));
  if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
    return { ok: false, code: 'INVALID_EXPIRES_IN' };
  }

  return { ok: true, tokens: { accessToken, refreshToken, expiresIn } };
}
