import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/api/unwrap';

const ONE_DAY = 24 * 60 * 60 * 1000;

export const regionKeys = {
  all: ['regions'] as const,
  sido: () => [...regionKeys.all, 'sido'] as const,
  sggu: (sidoCode: string) => [...regionKeys.all, 'sggu', sidoCode] as const,
};

export const regionQueries = {
  sido: () =>
    queryOptions({
      queryKey: regionKeys.sido(),
      queryFn: () => unwrap(apiClient.GET('/api/regions/sido')),
      staleTime: ONE_DAY,
    }),

  sggu: (sidoCode: string) =>
    queryOptions({
      queryKey: regionKeys.sggu(sidoCode),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/regions/sido/{sidoCode}/sggu', {
            params: { path: { sidoCode } },
          }),
        ),
      staleTime: ONE_DAY,
    }),
};
