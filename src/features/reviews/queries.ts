import { infiniteQueryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/api/unwrap';
import { shouldRetryQuery } from '@/lib/query-client';

export type ReviewSort = 'latest' | 'rating';

const REVIEW_PAGE_SIZE = 5;

export const reviewKeys = {
  all: ['reviews'] as const,
  hospital: (ykiho: string, sort: ReviewSort) =>
    [...reviewKeys.all, 'hospital', ykiho, sort] as const,
};

export const reviewQueries = {
  hospital: (ykiho: string, sort: ReviewSort = 'latest') =>
    infiniteQueryOptions({
      queryKey: reviewKeys.hospital(ykiho, sort),
      queryFn: ({ pageParam }) =>
        unwrap(
          apiClient.GET('/api/hospitals/{ykiho}/reviews', {
            params: {
              path: { ykiho },
              query: {
                sortCondition: { sort },
                pageQuery: { page: pageParam, size: REVIEW_PAGE_SIZE },
              },
            },
          }),
        ),
      /** 후기는 부가 정보라 5xx에도 한 번만 다시 시도해 빨리 실패를 보여 준다. */
      retry: (failureCount, error) =>
        shouldRetryQuery(failureCount, error) && failureCount < 1,
      initialPageParam: 0,
      getNextPageParam: (last) =>
        last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    }),
};
