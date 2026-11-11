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

  return function refresh() {
    inFlight ??= request().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
