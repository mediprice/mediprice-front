export type RefreshOutcome = 'ok' | 'unauthenticated' | 'unavailable';

/** 백엔드가 재발급마다 Refresh를 회전시키므로, 진행 중인 요청이 있으면 그 결과를 함께 기다린다. */
export function createRefresher(baseUrl: string) {
  let inFlight: Promise<RefreshOutcome> | null = null;

  async function request(): Promise<RefreshOutcome> {
    try {
      const response = await fetch(`${baseUrl}/session/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (response.ok) return 'ok';
      return response.status === 401 ? 'unauthenticated' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }

  function refresh() {
    inFlight ??= request().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  /** 진행 중인 재발급이 있으면 끝날 때까지 기다린다. 로그아웃이 늦게 도착한 재발급 응답에 덮이지 않게 쓴다. */
  async function settled() {
    await inFlight;
  }

  return Object.assign(refresh, { settled });
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
