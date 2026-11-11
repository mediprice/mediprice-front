export type RefreshOutcome = 'ok' | 'unauthenticated' | 'unavailable';

/**
 * 브라우저에서 BFF의 재발급(`POST {baseUrl}/session/refresh`)을 부르는 함수를 만든다.
 *
 * 백엔드는 재발급할 때마다 Refresh Token을 새로 발급하므로, 같은 Refresh로 동시에 두 번 요청하면 하나가
 * 거부된다. 그래서 진행 중인 요청이 있으면 새로 보내지 않고 그 결과를 함께 기다린다(single-flight).
 */
export function createRefresher(baseUrl: string) {
  let inFlight: Promise<RefreshOutcome> | null = null;

  async function request(): Promise<RefreshOutcome> {
    try {
      const response = await fetch(`${baseUrl}/session/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (response.ok) return 'ok';
      // 401은 Refresh가 없거나 거부된 경우다. 그 외(502 등)는 지금은 알 수 없다는 뜻이다.
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
