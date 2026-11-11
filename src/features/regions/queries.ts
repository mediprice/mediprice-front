import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/api/unwrap';

// 행정구역은 거의 바뀌지 않으므로 오래 캐시한다.
const ONE_DAY = 24 * 60 * 60 * 1000;

/** 쿼리 키. 도메인(`regions`)에서 항목으로 좁혀지는 계층이라 `regionKeys.all`로 한 번에 무효화할 수 있다. */
export const regionKeys = {
  all: ['regions'] as const,
  sido: () => [...regionKeys.all, 'sido'] as const,
  sggu: (sidoCode: string) => [...regionKeys.all, 'sggu', sidoCode] as const,
};

/** 화면에서는 `useQuery(regionQueries.sido())`처럼 쓴다. 서버에서 prefetch할 때도 같은 옵션을 쓴다. */
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
