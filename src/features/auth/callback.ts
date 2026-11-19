import type { QueryClient } from '@tanstack/react-query';

import { type ErrorMessageKey, errorMessageKey } from '@/lib/api/error-message';
import { getQueryClient } from '@/lib/query-client';

import { sessionQueries } from './queries';
import { consentHref, needsRequiredConsent } from './required-consent';
import { consumeReturnPath } from './return-path';
import { completeOAuthCallback, signOut } from './session';

/** 실패의 returnTo는 다시 로그인할 때 넘길 경로다(fragment에 있을 때만). */
export type CallbackOutcome =
  | { status: 'success'; returnTo: string }
  | { status: 'error'; code: string; returnTo: string | null };

/** 쿠키는 저장됐지만 백엔드가 토큰을 받아 주지 않은 경우(위조·만료 토큰). */
const SESSION_REJECTED = 'SESSION_REJECTED';

type Options = {
  queryClient?: QueryClient;
  complete?: typeof completeOAuthCallback;
  takeReturnPath?: () => string | null;
  discardSession?: () => Promise<void>;
};

/** 토큰을 쿠키로 바꾼 뒤 내 정보를 한 번 받아 확인한다(세션이 캐시에 들어가 이동한 화면의 헤더가 바로 로그인 상태다). 돌아갈 경로는 fragment의 returnTo, sessionStorage, 홈 순서이고, 필수 동의가 빠졌으면 동의 화면을 먼저 거친다. */
export async function runOAuthCallback(
  hash: string,
  {
    queryClient = getQueryClient(),
    complete = completeOAuthCallback,
    takeReturnPath = consumeReturnPath,
    discardSession = () => signOut(),
  }: Options = {},
): Promise<CallbackOutcome> {
  const result = await complete(hash, { queryClient });
  const { returnTo } = result;
  if (!result.ok) return { status: 'error', code: result.code, returnTo };

  let needsConsent = false;
  try {
    const user = await queryClient.fetchQuery(sessionQueries.current());
    if (!user) {
      /** 백엔드가 재발급에 5xx로 답하면 BFF가 쿠키를 남기므로 직접 지운다. */
      await discardSession();
      return { status: 'error', code: SESSION_REJECTED, returnTo };
    }
    needsConsent = needsRequiredConsent(user);
  } catch {
    /** 쿠키는 저장됐고 확인만 실패했다. 이동한 화면이 다시 확인한다(동의가 필요하면 셸의 ConsentGate가 보낸다). */
  }
  const stored = takeReturnPath();
  const destination = returnTo ?? stored ?? '/';
  return {
    status: 'success',
    returnTo: needsConsent ? consentHref(destination) : destination,
  };
}

let inFlight: Promise<CallbackOutcome> | null = null;

/** 개발 모드 StrictMode가 효과를 두 번 실행해도 fragment는 한 번만 쓴다(첫 실행이 주소창에서 지운다). */
export function runOAuthCallbackOnce() {
  inFlight ??= runOAuthCallback(window.location.hash);
  return inFlight;
}

export type CallbackErrorCopy =
  { kind: 'cancelled' } | { kind: 'failed'; messageKey: ErrorMessageKey };

/** Google 동의 화면에서 취소하면 OAuth 표준 코드 `access_denied`가 온다. 모르는 코드(SESSION_REJECTED 포함)는 로그인 실패 문구다. */
export function describeCallbackError(code: string): CallbackErrorCopy {
  if (code === 'access_denied') return { kind: 'cancelled' };
  if (code === 'NETWORK_ERROR')
    return { kind: 'failed', messageKey: 'network' };
  const key = errorMessageKey(code);
  return {
    kind: 'failed',
    messageKey: key === 'unknown' ? 'loginFailed' : key,
  };
}
