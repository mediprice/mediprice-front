import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
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
