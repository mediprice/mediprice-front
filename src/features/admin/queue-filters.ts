import { z } from 'zod';

import { firstParam } from '@/lib/search-params';

/** URL의 page는 사람이 읽는 1부터, 백엔드는 0부터 센다. */
export type QueueFilters<Status extends string> = {
  status: Status;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_PAGE = 1;
/** 백엔드가 허용하는 page 범위 안에서 터무니없는 값을 막는다. */
const MAX_PAGE = 10_000;

/** 관리자 처리 대기열(신고·이의 제기)의 상태·페이지 URL 필터. 잘못된 값은 기본값으로, 배열은 첫 값으로 읽는다. */
export function createQueueFilters<
  const Statuses extends readonly [string, ...string[]],
>(statuses: Statuses, defaultStatus: Statuses[number]) {
  type Filters = QueueFilters<Statuses[number]>;

  const searchSchema = z.object({
    status: z.preprocess(firstParam, z.enum(statuses).catch(defaultStatus)),
    page: z.preprocess(
      firstParam,
      z.coerce.number().int().min(1).max(MAX_PAGE).catch(DEFAULT_PAGE),
    ),
  });

  return {
    parse(searchParams: SearchParams): Filters {
      return searchSchema.parse({
        status: searchParams.status,
        page: searchParams.page ?? DEFAULT_PAGE,
      });
    },
    /** 기본값은 링크에서 뺀다. */
    buildQuery(filters: Filters) {
      const params = new URLSearchParams();
      if (filters.status !== defaultStatus) {
        params.set('status', filters.status);
      }
      if (filters.page !== DEFAULT_PAGE) {
        params.set('page', String(filters.page));
      }
      return params.toString();
    },
  };
}
