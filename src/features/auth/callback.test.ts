import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { describeCallbackError, runOAuthCallback } from './callback';
import type * as QueriesModule from './queries';
import { sessionKeys } from './queries';

vi.mock('./queries', async (importOriginal) => {
  const actual = await importOriginal<typeof QueriesModule>();
  return {
    ...actual,
    sessionQueries: {
      current: () => ({
        queryKey: actual.sessionKeys.current(),
        queryFn: () => currentUser(),
      }),
    },
  };
});

const currentUser = vi.fn<() => Promise<unknown>>();
const user = { id: 1, email: 'a@b.c', name: 'A', profileImageUrl: null };

type CompleteResult =
  | { ok: true; returnTo: string | null }
  | { ok: false; code: string; returnTo: string | null };

function run(
  completeResult: CompleteResult,
  returnPath: string | null = '/items/A',
) {
  const queryClient = new QueryClient();
  const complete = vi.fn(async () => completeResult);
  const discardSession = vi.fn(async () => {});
  return {
    queryClient,
    complete,
    discardSession,
    outcome: runOAuthCallback('#x', {
      queryClient,
      complete,
      takeReturnPath: () => returnPath,
      discardSession,
    }),
  };
}

describe('runOAuthCallback', () => {
  it('세션이 확인되면 저장한 경로로 보내고 세션을 캐시에 둔다', async () => {
    currentUser.mockResolvedValueOnce(user);
    const { outcome, queryClient } = run({ ok: true, returnTo: null });

    expect(await outcome).toEqual({ status: 'success', returnTo: '/items/A' });
    expect(queryClient.getQueryData(sessionKeys.current())).toEqual(user);
  });

  it('fragment의 돌아올 경로를 sessionStorage 값보다 먼저 쓴다', async () => {
    currentUser.mockResolvedValueOnce(user);
    const takeReturnPath = vi.fn(() => '/items/A');

    const outcome = await runOAuthCallback('#x', {
      queryClient: new QueryClient(),
      complete: async () => ({ ok: true as const, returnTo: '/hospitals/H' }),
      takeReturnPath,
    });

    expect(outcome).toEqual({ status: 'success', returnTo: '/hospitals/H' });
    expect(takeReturnPath).toHaveBeenCalledOnce();
  });

  it('저장한 경로가 없으면 홈으로 보낸다', async () => {
    currentUser.mockResolvedValueOnce(user);

    expect(await run({ ok: true, returnTo: null }, null).outcome).toEqual({
      status: 'success',
      returnTo: '/',
    });
  });

  it('백엔드가 보낸 에러 코드를 돌려준다', async () => {
    const { outcome } = run({
      ok: false,
      code: 'OAUTH2_EMAIL_NOT_VERIFIED',
      returnTo: '/my',
    });

    expect(await outcome).toEqual({
      status: 'error',
      code: 'OAUTH2_EMAIL_NOT_VERIFIED',
      returnTo: '/my',
    });
  });

  it('저장한 토큰이 거부되면(내 정보가 null) 실패로 보고 쿠키를 지운다', async () => {
    currentUser.mockResolvedValueOnce(null);
    const { outcome, discardSession } = run({ ok: true, returnTo: null });

    expect(await outcome).toEqual({
      status: 'error',
      code: 'SESSION_REJECTED',
      returnTo: null,
    });
    expect(discardSession).toHaveBeenCalledOnce();
  });

  it('세션 확인만 실패하면(장애) 그래도 이동한다', async () => {
    currentUser.mockRejectedValueOnce(new Error('down'));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const outcome = await runOAuthCallback('#x', {
      queryClient,
      complete: async () => ({ ok: true as const, returnTo: null }),
      takeReturnPath: () => null,
    });

    expect(outcome).toEqual({ status: 'success', returnTo: '/' });
  });
});

describe('describeCallbackError', () => {
  it.each([
    ['OAUTH2_EMAIL_NOT_VERIFIED', 'oauthEmailNotVerified'],
    ['OAUTH2_EMAIL_ALREADY_REGISTERED', 'oauthEmailAlreadyRegistered'],
    ['OAUTH2_LOGIN_FAILED', 'loginFailed'],
    ['MISSING_TOKENS', 'loginFailed'],
    ['NETWORK_ERROR', 'network'],
    ['SESSION_REJECTED', 'loginFailed'],
    ['UPSTREAM_UNAVAILABLE', 'serverUnavailable'],
  ])('%s는 errors.%s 문구다', (code, messageKey) => {
    expect(describeCallbackError(code)).toEqual({ kind: 'failed', messageKey });
  });

  it('Google 동의 화면에서 취소하면 취소 문구다', () => {
    expect(describeCallbackError('access_denied')).toEqual({
      kind: 'cancelled',
    });
  });
});
