import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/server';

import { createRefresher } from './refresh';

const BASE = 'http://app.test/bff';
const URL_ = `${BASE}/session/refresh`;

describe('createRefresher', () => {
  it('성공하면 ok다', async () => {
    server.use(
      http.post(URL_, () => HttpResponse.json({ authenticated: true })),
    );

    expect(await createRefresher(BASE)()).toBe('ok');
  });

  it('401이면 unauthenticated다', async () => {
    server.use(http.post(URL_, () => new HttpResponse(null, { status: 401 })));

    expect(await createRefresher(BASE)()).toBe('unauthenticated');
  });

  it.each([502, 500])('%i이면 unavailable이다', async (status) => {
    server.use(http.post(URL_, () => new HttpResponse(null, { status })));

    expect(await createRefresher(BASE)()).toBe('unavailable');
  });

  it('연결에 실패하면 unavailable이다', async () => {
    server.use(http.post(URL_, () => HttpResponse.error()));

    expect(await createRefresher(BASE)()).toBe('unavailable');
  });

  it('동시에 호출해도 요청은 한 번이고 모두 같은 결과를 받는다', async () => {
    let calls = 0;
    server.use(
      http.post(URL_, async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ authenticated: true });
      }),
    );
    const refresh = createRefresher(BASE);

    const results = await Promise.all([refresh(), refresh(), refresh()]);

    expect(results).toEqual(['ok', 'ok', 'ok']);
    expect(calls).toBe(1);
  });

  it('끝난 뒤에는 새로 요청한다', async () => {
    let calls = 0;
    server.use(
      http.post(URL_, () => {
        calls += 1;
        return HttpResponse.json({ authenticated: true });
      }),
    );
    const refresh = createRefresher(BASE);

    await refresh();
    await refresh();

    expect(calls).toBe(2);
  });
});
