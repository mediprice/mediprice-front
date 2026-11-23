import 'server-only';

import { createHash } from 'node:crypto';

import { type RefreshResult, refreshSession } from './refresh-session';

type Refresh = (
  refreshToken: string | undefined,
  incoming: Headers,
) => Promise<RefreshResult>;

/**
 * 백엔드가 Refresh를 회전시키므로 같은 Refresh로 온 재발급은 이 인스턴스에서 한 번만 부르고, 기다리던 요청이 결과를 나눈다.
 * 회전 직후 graceMs 동안 이전 Refresh로 늦게 온 요청은 새 토큰 없이 'rotated'를 받아 이긴 쪽의 새 쿠키를 지우지 않는다.
 * 새 토큰은 저장하지 않으므로 회전된 Refresh로는 새 토큰을 얻을 수 없다.
 */
export function coalesceRefresh(
  refresh: Refresh,
  { graceMs = 3_000 }: { graceMs?: number } = {},
): Refresh {
  const inFlight = new Map<string, Promise<RefreshResult>>();
  const rotated = new Set<string>();

  function markRotated(key: string) {
    rotated.add(key);
    setTimeout(() => rotated.delete(key), graceMs).unref?.();
  }

  return (refreshToken, incoming) => {
    if (!refreshToken) return refresh(refreshToken, incoming);

    const key = createHash('sha256').update(refreshToken).digest('hex');
    if (rotated.has(key)) return Promise.resolve({ status: 'rotated' });

    let pending = inFlight.get(key);
    if (!pending) {
      pending = refresh(refreshToken, incoming)
        .then((result) => {
          if (result.status === 'ok') markRotated(key);
          return result;
        })
        .finally(() => inFlight.delete(key));
      inFlight.set(key, pending);
    }
    return pending;
  };
}

export const refreshSessionOnce = coalesceRefresh(refreshSession);
