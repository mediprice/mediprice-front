export type RefreshOutcome = 'ok' | 'unauthenticated' | 'unavailable';

/** 서버가 백엔드를 기다리는 시간(35초)보다 조금 길게 잡아, BFF가 먼저 답할 기회를 준다. */
const REFRESH_TIMEOUT_MS = 40_000;

/** 백엔드가 재발급마다 Refresh를 회전시키므로, 진행 중인 요청이 있으면 그 결과를 함께 기다린다. */
export function createRefresher(
  baseUrl: string,
  { timeoutMs = REFRESH_TIMEOUT_MS }: { timeoutMs?: number } = {},
) {
  let inFlight: Promise<RefreshOutcome> | null = null;
  let pauses = 0;

  async function request(): Promise<RefreshOutcome> {
    try {
      const response = await fetch(`${baseUrl}/session/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return 'ok';
      return response.status === 401 ? 'unauthenticated' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }

  /** 일시 중지 중에는 요청하지 않는다. 세션 만료 이벤트가 나지 않게 'unauthenticated'가 아닌 'unavailable'이다. */
  function refresh() {
    if (pauses > 0) return Promise.resolve<RefreshOutcome>('unavailable');
    inFlight ??= request().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  /** 진행 중인 재발급이 끝나기를 기다린 뒤 task를 돌리고, 그동안 새 재발급을 막는다. 로그아웃이 재발급 응답에 덮이지 않게 쓴다. */
  async function pausedDuring<T>(task: () => Promise<T>) {
    pauses += 1;
    try {
      await inFlight;
      return await task();
    } finally {
      pauses -= 1;
    }
  }

  return Object.assign(refresh, { pausedDuring });
}

const refreshers = new Map<string, ReturnType<typeof createRefresher>>();

/** 브라우저의 모든 API 클라이언트와 세션 확인이 같은 재발급을 함께 기다리도록 baseUrl마다 하나만 만든다. */
export function sharedRefresher(baseUrl: string) {
  let refresh = refreshers.get(baseUrl);
  if (!refresh) {
    refresh = createRefresher(baseUrl);
    refreshers.set(baseUrl, refresh);
  }
  return refresh;
}
