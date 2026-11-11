import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { API, server } from '@/test/server';

import { refreshSession } from './session';

const newTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

describe('refreshSession', () => {
  it('Refresh를 백엔드에 보내 새 토큰을 받는다', async () => {
    let received: unknown;
    server.use(
      http.post(`${API}/api/auth/refresh`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(newTokens);
      }),
    );

    expect(await refreshSession('old-refresh')).toEqual({
      status: 'ok',
      tokens: {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
      },
    });
    expect(received).toEqual({ refreshToken: 'old-refresh' });
  });

  it('Refresh 쿠키가 없으면 백엔드를 부르지 않고 unauthenticated다', async () => {
    expect(await refreshSession(undefined)).toEqual({
      status: 'unauthenticated',
    });
  });

  it.each([401, 404])(
    '백엔드가 %i로 거부하면 unauthenticated다',
    async (status) => {
      server.use(
        http.post(`${API}/api/auth/refresh`, () =>
          HttpResponse.json(
            { code: 'EXPIRED_REFRESH_TOKEN', message: '만료', errors: [] },
            { status },
          ),
        ),
      );

      expect(await refreshSession('r')).toEqual({ status: 'unauthenticated' });
    },
  );

  it('백엔드 장애(5xx)와 연결 실패는 unavailable이다', async () => {
    server.use(
      http.post(
        `${API}/api/auth/refresh`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    expect(await refreshSession('r')).toEqual({ status: 'unavailable' });

    server.use(
      http.post(`${API}/api/auth/refresh`, () => HttpResponse.error()),
    );
    expect(await refreshSession('r')).toEqual({ status: 'unavailable' });
  });

  it('응답이 약속된 형식이 아니면 unavailable이다', async () => {
    server.use(
      http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json({ nope: 1 }),
      ),
    );

    expect(await refreshSession('r')).toEqual({ status: 'unavailable' });
  });
});
