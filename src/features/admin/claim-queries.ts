import {
  keepPreviousData,
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import { reviewKeys } from '@/features/reviews/queries';
import { ApiError, isUnsupportedEndpoint } from '@/lib/api/errors';

import {
  type AdminClaim,
  adminClaimApi,
  type ClaimNotification,
  type ClaimResolution,
  type ClaimStatus,
} from './claim-api';
import { type ClaimFilters, toClaimsRequest } from './claim-filters';
import { adminKeys } from './queries';

const CLAIM_PAGE_SIZE = 20;

export const adminClaimQueries = {
  list: (filters: ClaimFilters) =>
    queryOptions({
      queryKey: adminKeys.claimList(filters),
      queryFn: () =>
        adminClaimApi.list(toClaimsRequest(filters, CLAIM_PAGE_SIZE)),
      placeholderData: keepPreviousData,
    }),

  /** 목록에서 연 신고를 먼저 보여 주고, 그사이 들어온 재게시 요청·알림 기록을 다시 받는다. */
  detail: (claim: AdminClaim) =>
    queryOptions({
      queryKey: adminKeys.claimDetail(claim.id),
      queryFn: () => adminClaimApi.detail(claim.id),
      placeholderData: claim,
    }),

  /** 개수만 필요해서 한 건짜리 페이지의 totalElements를 쓴다. 서버에 기능이 없으면 null이다. */
  count: (status: ClaimStatus) =>
    queryOptions({
      queryKey: adminKeys.claimCount(status),
      queryFn: async () => {
        try {
          const page = await adminClaimApi.list({ status, page: 0, size: 1 });
          return page.totalElements;
        } catch (error) {
          if (isUnsupportedEndpoint(error)) return null;
          throw error;
        }
      },
    }),
};

/** 처리하면 목록·개수와 공개 후기가 달라진다. 기다리지 않아서 다이얼로그가 먼저 닫힌다. */
function invalidateClaims(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminKeys.claims() });
}

/** 다른 운영자가 먼저 처리했거나(409) 신고가 없어졌으면(404) 보고 있는 목록이 낡은 것이다. */
function isStaleClaimError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'CLAIM_ALREADY_RESOLVED' ||
      error.code === 'CLAIM_NOT_FOUND')
  );
}

export const adminClaimMutations = {
  resolve: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: ({
        claimId,
        ...body
      }: ClaimResolution & { claimId: number }) =>
        adminClaimApi.resolve(claimId, body),
      onSuccess: (claim) => {
        queryClient.setQueryData(adminKeys.claimDetail(claim.id), claim);
        invalidateClaims(queryClient);
        void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      },
      onError: (error) => {
        if (isStaleClaimError(error)) invalidateClaims(queryClient);
      },
    }),

  markNotified: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: ({
        claimId,
        ...body
      }: ClaimNotification & { claimId: number }) =>
        adminClaimApi.markNotified(claimId, body),
      onSuccess: (claim) => {
        queryClient.setQueryData(adminKeys.claimDetail(claim.id), claim);
        invalidateClaims(queryClient);
      },
    }),
};
