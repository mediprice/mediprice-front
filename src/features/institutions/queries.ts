import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/api/unwrap';

const ONE_DAY = 24 * 60 * 60 * 1000;

export const institutionKeys = {
  all: ['institutions'] as const,
  types: () => [...institutionKeys.all, 'types'] as const,
};

export const institutionQueries = {
  types: () =>
    queryOptions({
      queryKey: institutionKeys.types(),
      queryFn: () => unwrap(apiClient.GET('/api/institution-types')),
      staleTime: ONE_DAY,
    }),
};
