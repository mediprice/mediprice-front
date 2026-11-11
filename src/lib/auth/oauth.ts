import { env } from '@/env';

/** 구글 로그인을 시작하는 백엔드 주소. 브라우저가 이 주소로 이동하면 백엔드가 구글로 보낸다. */
export function loginUrl() {
  return new URL('/oauth2/authorization/google', env.NEXT_PUBLIC_API_URL).href;
}

export type CallbackTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type CallbackResult =
  { ok: true; tokens: CallbackTokens } | { ok: false; code: string };

/**
 * 로그인이 끝난 뒤 백엔드가 돌려보낸 콜백 주소의 fragment를 해석한다.
 * 성공: `#accessToken=…&refreshToken=…&expiresIn=…`, 실패: `#error=OAUTH2_LOGIN_FAILED`
 */
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
