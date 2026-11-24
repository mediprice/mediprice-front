import createClient from 'openapi-fetch';

import { toApiError } from './errors';
import { BFF_BASE } from './paths';
import { serializeQuery } from './query';
import { type createRefresher, sharedRefresher } from './refresh';
import type { paths } from './schema';
import {
  emitRequiredConsentsMissing,
  emitSessionExpired,
} from './session-events';

/** 백엔드가 필수 동의(약관·개인정보·나이)가 없는 회원의 쓰기 요청을 거부할 때 쓰는 코드. */
const REQUIRED_CONSENTS_MISSING = 'REQUIRED_CONSENTS_MISSING';

type Options = {
  baseUrl: string;
  onSessionExpired?: () => void;
  refresh?: ReturnType<typeof createRefresher>;
};

/** 401이면 재발급을 거쳐 같은 요청을 한 번만 다시 보낸다. 필수 동의가 없어 거부되면(403) 동의 화면으로 보내도록 알린다. */
export function createApiFetch({
  baseUrl,
  onSessionExpired,
  refresh = sharedRefresher(baseUrl),
}: Options) {
  async function send(input: Request) {
    const retry = input.clone();
    const response = await fetch(input);

    if (response.status !== 401 || isSessionRequest(input.url, baseUrl)) {
      return response;
    }

    const outcome = await refresh();
    if (outcome === 'ok') return fetch(retry);
    if (outcome === 'unauthenticated') onSessionExpired?.();
    return response;
  }

  return async function apiFetch(input: Request) {
    const response = await send(input);
    if (await isRequiredConsentsMissing(response)) {
      emitRequiredConsentsMissing();
    }
    return response;
  };
}

/** 본문은 호출한 쪽이 다시 읽으므로 복제본으로 코드를 본다. */
async function isRequiredConsentsMissing(response: Response) {
  if (response.status !== 403) return false;
  const { code } = await toApiError(response.clone());
  return code === REQUIRED_CONSENTS_MISSING;
}

/** 세션 요청의 401은 "로그인 안 함"이라는 답이므로 재발급하지 않는다. */
function isSessionRequest(url: string, baseUrl: string) {
  const sessionPath = new URL(`${baseUrl}/session`, url).pathname;
  return new URL(url).pathname.startsWith(sessionPath);
}

export function createApiClient(options: Options) {
  return createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: createApiFetch(options),
    querySerializer: serializeQuery,
  });
}

/** 쿼리 옵션이 받는 생성 클라이언트. 서버 prefetch는 같은 옵션에 익명 공개 클라이언트를 넘긴다. */
export type ApiClient = ReturnType<typeof createApiClient>;

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const apiClient = createApiClient({
  baseUrl: BFF_BASE,
  onSessionExpired: emitSessionExpired,
});
