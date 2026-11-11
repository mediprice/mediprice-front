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
