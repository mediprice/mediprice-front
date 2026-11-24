import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { API, server } from '@/test/server';

import { readSessionUser } from './session-user';

describe('readSessionUser', () => {
  it('백엔드가 늦으면 기다리지 않고 null이다', async () => {
    server.use(
      http.get(`${API}/api/users/me`, async () => {
        await delay(1_000);
        return HttpResponse.json({ id: 1 });
      }),
    );

    const startedAt = Date.now();
    const user = await readSessionUser('a1', new Headers(), 50);

    expect(user).toBeNull();
    expect(Date.now() - startedAt).toBeLessThan(500);
  });

  it('실패 응답은 본문을 읽지 않고 null이다', async () => {
    server.use(
      http.get(`${API}/api/users/me`, () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    );

    expect(await readSessionUser('a1', new Headers())).toBeNull();
  });
});
