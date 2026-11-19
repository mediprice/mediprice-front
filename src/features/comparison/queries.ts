import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

export type ComparisonHospital = components['schemas']['HospitalColumn'];
export type ComparisonItem = components['schemas']['ItemRow'];

export const comparisonKeys = {
  all: ['comparisons'] as const,
  table: (ykihos: readonly string[], npayCodes: readonly string[]) =>
    [...comparisonKeys.all, 'table', { ykihos, npayCodes }] as const,
};

export const comparisonQueries = {
  /** 항목을 주지 않으면 병원들이 함께 공개한 항목을 100개까지 준다(넘으면 truncated). 열 순서는 ykihos 순서다. */
  table: (ykihos: readonly string[], npayCodes: readonly string[] = []) =>
    queryOptions({
      queryKey: comparisonKeys.table(ykihos, npayCodes),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/comparisons', {
            params: {
              query: {
                condition: {
                  ykihos: [...ykihos],
                  ...(npayCodes.length > 0 && { npayCodes: [...npayCodes] }),
                },
              },
            },
          }),
        ),
    }),
};
