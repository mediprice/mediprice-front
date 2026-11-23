import 'server-only';

import { createHash } from 'node:crypto';

import { type RefreshResult, refreshSession } from './refresh-session';

type Refresh = (
  refreshToken: string | undefined,
  incoming: Headers,
) => Promise<RefreshResult>;

type Options = { graceMs?: number; now?: () => number };

/** 백엔드가 Refresh를 회전시키므로, 같은 Refresh로 온 재발급은 이 인스턴스에서 한 번만 부르고 성공 결과를 graceMs 동안 다시 돌려준다. 늦게 온 쪽이 거부돼 이긴 쪽의 새 쿠키를 지우지 않게 하려는 것이다. */
export function coalesceRefresh(
  refresh: Refresh,
  { graceMs = 10_000, now = Date.now }: Options = {},
): Refresh {
  const inFlight = new Map<string, Promise<RefreshResult>>();
  const recent = new Map<string, { result: RefreshResult; until: number }>();

  return (refreshToken, incoming) => {
    if (!refreshToken) return refresh(refreshToken, incoming);

    for (const [key, entry] of recent) {
      if (entry.until <= now()) recent.delete(key);
    }
    const key = createHash('sha256').update(refreshToken).digest('hex');
    const cached = recent.get(key);
    if (cached) return Promise.resolve(cached.result);

    let pending = inFlight.get(key);
    if (!pending) {
      pending = refresh(refreshToken, incoming)
        .then((result) => {
          if (result.status === 'ok') {
            recent.set(key, { result, until: now() + graceMs });
          }
          return result;
        })
        .finally(() => inFlight.delete(key));
      inFlight.set(key, pending);
    }
    return pending;
  };
}

export const refreshSessionOnce = coalesceRefresh(refreshSession);
