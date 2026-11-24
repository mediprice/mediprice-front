import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { coalesceRefresh } from './refresh-coalescer';
import type { RefreshResult } from './refresh-session';

const ok = (refreshToken: string): RefreshResult => ({
  status: 'ok',
  tokens: { accessToken: `a-${refreshToken}`, refreshToken, expiresIn: 3600 },
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function setup() {
  const backend =
    vi.fn<(token: string | undefined) => Promise<RefreshResult>>();
  const refresh = coalesceRefresh((token) => backend(token), {
    graceMs: 3_000,
  });
  return {
    backend,
    refresh: (token: string | undefined) => refresh(token, new Headers()),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('coalesceRefresh', () => {
  it('같은 Refresh로 동시에 오면 백엔드를 한 번만 부르고 같은 결과를 나눈다', async () => {
    const { backend, refresh } = setup();
    const pending = deferred<RefreshResult>();
    backend.mockReturnValueOnce(pending.promise);

    const results = Promise.all([refresh('r1'), refresh('r1'), refresh('r1')]);
    pending.resolve(ok('r2'));

    expect(await results).toEqual([ok('r2'), ok('r2'), ok('r2')]);
    expect(backend).toHaveBeenCalledOnce();
  });

  it('회전 직후 이전 Refresh로 늦게 온 요청은 새 토큰 없이 회전됐다고만 받는다', async () => {
    const { backend, refresh } = setup();
    backend.mockResolvedValueOnce(ok('r2'));
    backend.mockResolvedValue({ status: 'unauthenticated' });

    await refresh('r1');
    await vi.advanceTimersByTimeAsync(2_000);

    expect(await refresh('r1')).toEqual({ status: 'rotated' });
    expect(backend).toHaveBeenCalledOnce();
  });

  it('유예 시간이 지나면 이전 Refresh는 백엔드에 물어 거부된다', async () => {
    const { backend, refresh } = setup();
    backend.mockResolvedValueOnce(ok('r2'));
    backend.mockResolvedValue({ status: 'unauthenticated' });

    await refresh('r1');
    await vi.advanceTimersByTimeAsync(3_001);

    expect(await refresh('r1')).toEqual({ status: 'unauthenticated' });
    expect(backend).toHaveBeenCalledTimes(2);
  });

  it('회전 표시는 유예 시간이 지나면 타이머로 지워진다', async () => {
    const { backend, refresh } = setup();
    backend.mockResolvedValueOnce(ok('r2'));

    await refresh('r1');

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(3_001);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([{ status: 'unauthenticated' }, { status: 'unavailable' }] as const)(
    '$status 결과는 끝난 뒤 다시 쓰지 않는다',
    async (result) => {
      const { backend, refresh } = setup();
      backend.mockResolvedValue(result);

      await refresh('r1');
      await refresh('r1');

      expect(backend).toHaveBeenCalledTimes(2);
    },
  );

  it('서로 다른 Refresh는 합치지 않는다', async () => {
    const { backend, refresh } = setup();
    backend.mockImplementation((token) => Promise.resolve(ok(`${token}-next`)));

    const [first, second] = await Promise.all([refresh('r1'), refresh('x1')]);

    expect(first).toEqual(ok('r1-next'));
    expect(second).toEqual(ok('x1-next'));
    expect(backend).toHaveBeenCalledTimes(2);
  });

  it('Refresh가 없으면 합치지 않고 그대로 넘긴다', async () => {
    const { backend, refresh } = setup();
    backend.mockResolvedValue({ status: 'unauthenticated' });

    expect(await refresh(undefined)).toEqual({ status: 'unauthenticated' });
    expect(backend).toHaveBeenCalledWith(undefined);
  });
});
