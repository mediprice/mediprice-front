import type { ClaimStatus } from './claim-api';
import { createQueueFilters, type QueueFilters } from './queue-filters';

/** 기한 지난 신고(expired)는 먼저 처리할 일이라 대기 바로 옆에 둔다. */
export const CLAIM_STATUS_FILTERS = ['pending', 'expired', 'resolved'] as const;
type ClaimStatusFilter = (typeof CLAIM_STATUS_FILTERS)[number];

export type ClaimFilters = QueueFilters<ClaimStatusFilter>;

const claimFilters = createQueueFilters(CLAIM_STATUS_FILTERS, 'pending');

export const parseClaimFilters = claimFilters.parse;
export const buildClaimFiltersQuery = claimFilters.buildQuery;

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
