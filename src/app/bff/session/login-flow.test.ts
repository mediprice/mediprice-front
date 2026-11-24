import { QueryClient } from '@tanstack/react-query';
import { http } from 'msw';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { completeOAuthCallback } from '@/features/auth/session';
import { bffRequest } from '@/test/request';
import { server } from '@/test/server';

import { GET as startLogin } from './login/route';
import { POST as createSession } from './route';

const APP = 'http://localhost:3000';

/** 브라우저처럼 BFF 응답의 Set-Cookie를 모았다가 다음 요청에 싣는다. */
function cookieJar() {
  const jar = new Map<string, string>();
  return {
    store(response: Response) {
      for (const line of response.headers.getSetCookie()) {
        const [pair = ''] = line.split(';');
        const [name = '', value = ''] = pair.split('=');
        if (/Max-Age=0/i.test(line)) jar.delete(name);
        else jar.set(name, value);
      }
    },
    header: () =>
      [...jar].map(([name, value]) => `${name}=${value}`).join('; '),
    has: (name: string) => jar.has(name),
    /** 운영 쿠키 이름에는 접두사가 붙을 수 있어 끝부분으로 찾는다. */
    hasSession: () =>
      [...jar.keys()].some((name) => name.endsWith('mp_access')) &&
      [...jar.keys()].some((name) => name.endsWith('mp_refresh')),
  };
}

/** 로그인 성공 뒤 백엔드가 콜백으로 돌려보내는 주소의 fragment를 흉내 낸다. */
function backendCallbackHash(loginLocation: string) {
  const state = new URL(loginLocation).searchParams.get('login_state') ?? '';
  return `#${new URLSearchParams({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    expiresIn: '3600',
    loginState: state,
    returnTo: '/my',
  })}`;
}

function routeSessionTo(jar: ReturnType<typeof cookieJar>) {
  server.use(
    http.post(`${APP}/bff/session`, async ({ request }) => {
      const response = await createSession(
        new NextRequest(request.url, {
          method: 'POST',
          headers: {
            origin: APP,
            host: 'localhost:3000',
            'content-type': 'application/json',
            cookie: jar.header(),
          },
          body: await request.text(),
        }),
      );
      jar.store(response);
      return response;
    }),
  );
}

function startIn(jar: ReturnType<typeof cookieJar>) {
  const response = startLogin(bffRequest('/bff/session/login?return_to=%2Fmy'));
  jar.store(response);
  return response.headers.get('location') ?? '';
}

describe('로그인 시작부터 콜백까지(백엔드 없이 fragment를 흉내 냄)', () => {
  it('이 브라우저가 시작한 로그인이면 세션 쿠키를 만들고 확인 값 쿠키를 지운다', async () => {
    const jar = cookieJar();
    routeSessionTo(jar);
    const location = startIn(jar);
    expect(jar.has('mp_login_state')).toBe(true);

    const result = await completeOAuthCallback(backendCallbackHash(location), {
      baseUrl: `${APP}/bff`,
      clearFragment: vi.fn(),
      queryClient: new QueryClient(),
    });

    expect(result).toEqual({ ok: true, returnTo: '/my' });
    expect(jar.hasSession()).toBe(true);
    expect(jar.has('mp_login_state')).toBe(false);
  });

  it('다른 브라우저에서 시작한 로그인의 콜백 주소를 열면 세션을 만들지 않는다', async () => {
    const victim = cookieJar();
    routeSessionTo(victim);
    startIn(victim);
    const otherLocation = startIn(cookieJar());

    const result = await completeOAuthCallback(
      backendCallbackHash(otherLocation),
      {
        baseUrl: `${APP}/bff`,
        clearFragment: vi.fn(),
        queryClient: new QueryClient(),
      },
    );

    expect(result).toEqual({
      ok: false,
      code: 'LOGIN_STATE_MISMATCH',
      returnTo: '/my',
    });
    expect(victim.hasSession()).toBe(false);
    expect(victim.has('mp_login_state')).toBe(false);
  });

  it('로그인을 시작하지 않은 브라우저는 세션을 만들지 않는다', async () => {
    const jar = cookieJar();
    routeSessionTo(jar);
    const otherLocation = startIn(cookieJar());

    const result = await completeOAuthCallback(
      backendCallbackHash(otherLocation),
      {
        baseUrl: `${APP}/bff`,
        clearFragment: vi.fn(),
        queryClient: new QueryClient(),
      },
    );

    expect(result).toMatchObject({ ok: false, code: 'LOGIN_STATE_MISMATCH' });
    expect(jar.hasSession()).toBe(false);
  });
});
