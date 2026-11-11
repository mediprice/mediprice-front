import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import type { paths } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

/**
 * 병원 검색 조건. 백엔드가 조건 객체(`condition`)와 페이지(`pageQuery`)로 나누어 문서화하지만,
 * 실제 요청은 `?keyword=…&page=0&size=20`처럼 평평한 쿼리 문자열로 나간다.
 */
export type HospitalSearchParams = NonNullable<
  paths['/api/hospitals']['get']['parameters']['query']
>;

export const hospitalKeys = {
  all: ['hospitals'] as const,
  lists: () => [...hospitalKeys.all, 'list'] as const,
  list: (params: HospitalSearchParams) =>
    [...hospitalKeys.lists(), params] as const,
  details: () => [...hospitalKeys.all, 'detail'] as const,
  detail: (ykiho: string) => [...hospitalKeys.details(), ykiho] as const,
};

export const hospitalQueries = {
  search: (params: HospitalSearchParams) =>
    queryOptions({
      queryKey: hospitalKeys.list(params),
      queryFn: () =>
        unwrap(apiClient.GET('/api/hospitals', { params: { query: params } })),
    }),

  detail: (ykiho: string) =>
    queryOptions({
      queryKey: hospitalKeys.detail(ykiho),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/hospitals/{ykiho}', {
            params: { path: { ykiho } },
          }),
        ),
    }),
};
