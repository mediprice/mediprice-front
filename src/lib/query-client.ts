import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from '@tanstack/react-query';

import { ApiError } from './api/errors';

/** 4xx는 다시 보내도 결과가 같고 401은 refresh가 따로 처리하므로 재시도하지 않는다. */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 3;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: shouldRetryQuery,
      },
      dehydrate: {
        // Include pending queries so server-started prefetches can stream to the client.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  // Server: always a new client per request. Browser: reuse a singleton so it
  // survives React discarding state when the initial render suspends.
  if (isServer) return makeQueryClient();
  return (browserQueryClient ??= makeQueryClient());
}
