import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from '@tanstack/react-query';

import { ApiError } from '@/lib/api/errors';

/**
 * 4xx는 다시 보내도 결과가 같고 401은 refresh가 따로 처리하므로 재시도하지 않는다.
 * 5xx·네트워크 오류는 잠깐 뒤 한 번만 다시 보낸다. 여러 번 기다리면 오류 화면까지 7~10초 동안 뼈대만 보인다.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 1;
}

const RETRY_DELAY_MS = 800;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: shouldRetryQuery,
        retryDelay: RETRY_DELAY_MS,
      },
      dehydrate: {
        /** 서버에서 시작한 prefetch가 끝나기 전에도 클라이언트로 스트리밍되게 pending 쿼리를 함께 넘긴다. */
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  /** 서버는 요청마다 새로 만들고, 브라우저는 첫 렌더가 suspend돼 React가 상태를 버려도 남도록 하나를 다시 쓴다. */
  if (isServer) return makeQueryClient();
  return (browserQueryClient ??= makeQueryClient());
}
