import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/server';

import { completeOAuthCallback, getSession, signOut } from './session';

const BASE = 'http://app.test/bff';
const hash = '#accessToken=a1&refreshToken=r1&expiresIn=3600';

describe('completeOAuthCallback', () => {
  it('토큰을 BFF에 한 번 넘기고 주소창의 fragment를 지운다', async () => {
    let received: unknown;
    server.use(
      http.post(`${BASE}/session`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ authenticated: true });
      }),
    );
    const clearFragment = vi.fn();

    const result = await completeOAuthCallback(hash, {
      baseUrl: BASE,
      clearFragment,
    });

    expect(result).toEqual({ ok: true });
    expect(received).toEqual({
      accessToken: 'a1',
      refreshToken: 'r1',
      expiresIn: 3600,
    });
    expect(clearFragment).toHaveBeenCalledOnce();
  });

  it('요청이 실패해도 fragment는 지운다', async () => {
    server.use(http.post(`${BASE}/session`, () => HttpResponse.error()));
    const clearFragment = vi.fn();

    const result = await completeOAuthCallback(hash, {
      baseUrl: BASE,
      clearFragment,
    });

    expect(result).toEqual({ ok: false, code: 'NETWORK_ERROR' });
    expect(clearFragment).toHaveBeenCalledOnce();
  });

  it('BFF가 거부하면 그 코드를 돌려준다', async () => {
    server.use(
      http.post(`${BASE}/session`, () =>
        HttpResponse.json(
          { code: 'INVALID_INPUT', message: 'x', errors: [] },
          { status: 400 },
        ),
      ),
    );

    const result = await completeOAuthCallback(hash, {
      baseUrl: BASE,
      clearFragment: vi.fn(),
    });

    expect(result).toEqual({ ok: false, code: 'INVALID_INPUT' });
  });

  it('백엔드 로그인 실패는 BFF를 부르지 않고 코드를 돌려준다', async () => {
    const clearFragment = vi.fn();

    const result = await completeOAuthCallback('#error=OAUTH2_LOGIN_FAILED', {
      baseUrl: BASE,
      clearFragment,
    });

    expect(result).toEqual({ ok: false, code: 'OAUTH2_LOGIN_FAILED' });
    expect(clearFragment).toHaveBeenCalledOnce();
  });
});

describe('로그인 상태 전환 시 쿼리 캐시', () => {
  function cachedClient() {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['hospitals', 'detail', 'H1'], { mine: false });
    return queryClient;
  }

  it('로그인에 성공하면 비로그인 때 받은 캐시를 비운다', async () => {
    server.use(
      http.post(`${BASE}/session`, () =>
        HttpResponse.json({ authenticated: true }),
      ),
    );
    const queryClient = cachedClient();

    await completeOAuthCallback(hash, {
      baseUrl: BASE,
      clearFragment: vi.fn(),
      queryClient,
    });

    expect(
      queryClient.getQueryData(['hospitals', 'detail', 'H1']),
    ).toBeUndefined();
  });

  it('로그인에 실패하면 캐시를 그대로 둔다', async () => {
    server.use(http.post(`${BASE}/session`, () => HttpResponse.error()));
    const queryClient = cachedClient();

    await completeOAuthCallback(hash, {
      baseUrl: BASE,
      clearFragment: vi.fn(),
      queryClient,
    });

    expect(
      queryClient.getQueryData(['hospitals', 'detail', 'H1']),
    ).toBeDefined();
  });

  it('로그아웃하면 서버 요청이 실패해도 캐시를 비운다', async () => {
    server.use(http.delete(`${BASE}/session`, () => HttpResponse.error()));
    const queryClient = cachedClient();

    await signOut(BASE, queryClient);

    expect(
      queryClient.getQueryData(['hospitals', 'detail', 'H1']),
    ).toBeUndefined();
  });
});

describe('getSession', () => {
  it.each([
    [true, 'authenticated'],
    [false, 'anonymous'],
  ])('authenticated=%s이면 %s다', async (authenticated, expected) => {
    server.use(
      http.get(`${BASE}/session`, () => HttpResponse.json({ authenticated })),
    );

    expect(await getSession(BASE)).toBe(expected);
  });

  it('BFF가 502면 unavailable이다', async () => {
    server.use(
      http.get(
        `${BASE}/session`,
        () => new HttpResponse(null, { status: 502 }),
      ),
    );

    expect(await getSession(BASE)).toBe('unavailable');
  });

  it('응답이 약속된 형식이 아니면 unavailable이다', async () => {
    server.use(http.get(`${BASE}/session`, () => HttpResponse.json({ ok: 1 })));

    expect(await getSession(BASE)).toBe('unavailable');
  });

  it('연결에 실패하면 unavailable이다', async () => {
    server.use(http.get(`${BASE}/session`, () => HttpResponse.error()));

    expect(await getSession(BASE)).toBe('unavailable');
  });
});

describe('signOut', () => {
  it('BFF에 로그아웃을 요청한다', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/session`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await signOut(BASE);

    expect(called).toBe(true);
  });

  it('요청이 실패해도 예외를 던지지 않는다', async () => {
    server.use(http.delete(`${BASE}/session`, () => HttpResponse.error()));

    await expect(signOut(BASE)).resolves.toBeUndefined();
  });
});
