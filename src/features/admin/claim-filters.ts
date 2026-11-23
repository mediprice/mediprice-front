import { z } from 'zod';

import type { ClaimStatus } from './claim-api';

/** 기한 지난 신고(expired)는 먼저 처리할 일이라 대기 바로 옆에 둔다. */
export const CLAIM_STATUS_FILTERS = ['pending', 'expired', 'resolved'] as const;
type ClaimStatusFilter = (typeof CLAIM_STATUS_FILTERS)[number];

/** URL의 page는 사람이 읽는 1부터, 백엔드는 0부터 센다. */
export type ClaimFilters = { status: ClaimStatusFilter; page: number };

const DEFAULT_CLAIM_FILTERS: ClaimFilters = { status: 'pending', page: 1 };
const MAX_PAGE = 10_000;

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const searchSchema = z.object({
  status: z.preprocess(
    first,
    z.enum(CLAIM_STATUS_FILTERS).catch(DEFAULT_CLAIM_FILTERS.status),
  ),
  page: z.preprocess(
    first,
    z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE)
      .catch(DEFAULT_CLAIM_FILTERS.page),
  ),
});

export function parseClaimFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ClaimFilters {
  return searchSchema.parse({
    status: searchParams.status,
    page: searchParams.page ?? DEFAULT_CLAIM_FILTERS.page,
  });
}

/** 기본값은 링크에서 뺀다. */
export function buildClaimFiltersQuery(filters: ClaimFilters) {
  const params = new URLSearchParams();
  if (filters.status !== DEFAULT_CLAIM_FILTERS.status) {
    params.set('status', filters.status);
  }
  if (filters.page !== DEFAULT_CLAIM_FILTERS.page) {
    params.set('page', String(filters.page));
  }
  return params.toString();
}

const STATUS_CONDITION = {
  pending: 'PENDING',
  expired: 'EXPIRED_PENDING',
  resolved: 'RESOLVED',
} as const satisfies Record<ClaimStatusFilter, ClaimStatus>;

export function toClaimsRequest(filters: ClaimFilters, size: number) {
  return {
    status: STATUS_CONDITION[filters.status],
    page: filters.page - 1,
    size,
  };
}
