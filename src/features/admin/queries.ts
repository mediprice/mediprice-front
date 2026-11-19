import {
  keepPreviousData,
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import { reviewKeys } from '@/features/reviews/queries';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

import { type ReportFilters, toReportsRequest } from './report-filters';

export type AdminReport = components['schemas']['AdminReportResponse'];
export type ReportAction =
  components['schemas']['ResolveReportRequest']['action'];
export type BatchJob = components['schemas']['JobStatus'];

const REPORT_PAGE_SIZE = 20;

export const adminKeys = {
  all: ['admin'] as const,
  batchStatus: () => [...adminKeys.all, 'batch-status'] as const,
  reports: () => [...adminKeys.all, 'reports'] as const,
  reportList: (filters: ReportFilters) =>
    [...adminKeys.reports(), 'list', filters.status, filters.page] as const,
  pendingCount: () => [...adminKeys.reports(), 'pending-count'] as const,
};

export const adminQueries = {
  batchStatus: () =>
    queryOptions({
      queryKey: adminKeys.batchStatus(),
      queryFn: () => unwrap(apiClient.GET('/api/admin/batch-status')),
    }),

  reports: (filters: ReportFilters) =>
    queryOptions({
      queryKey: adminKeys.reportList(filters),
      queryFn: () =>
        unwrap(
          apiClient.GET('/api/admin/reports', {
            params: { query: toReportsRequest(filters, REPORT_PAGE_SIZE) },
          }),
        ),
      /** 필터·페이지를 바꾸는 동안 이전 목록을 남겨 화면이 비었다 채워지지 않게 한다. */
      placeholderData: keepPreviousData,
    }),

  /** 개수만 필요해서 한 건짜리 페이지의 totalElements를 쓴다. */
  pendingCount: () =>
    queryOptions({
      queryKey: adminKeys.pendingCount(),
      queryFn: async () => {
        const page = await unwrap(
          apiClient.GET('/api/admin/reports', {
            params: {
              query: toReportsRequest({ status: 'pending', page: 1 }, 1),
            },
          }),
        );
        return page.totalElements;
      },
    }),
};

/** 신고를 처리하면 목록·개수와 공개 후기가 달라진다. 기다리지 않아서 다이얼로그가 먼저 닫힌다. */
function invalidateAfterResolve(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
  void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
}

/** 다른 운영자가 먼저 처리했거나(409) 신고가 없어졌으면(404) 보고 있는 목록이 낡은 것이다. */
function isStaleReportError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'REPORT_ALREADY_RESOLVED' ||
      error.code === 'REPORT_NOT_FOUND')
  );
}

export const adminMutations = {
  resolveReport: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: ({
        reportId,
        action,
      }: {
        reportId: number;
        action: ReportAction;
      }) =>
        unwrap(
          apiClient.PATCH('/api/admin/reports/{reportId}', {
            params: { path: { reportId } },
            body: { action },
          }),
        ),
      onSuccess: () => invalidateAfterResolve(queryClient),
      onError: (error) => {
        if (isStaleReportError(error)) invalidateAfterResolve(queryClient);
      },
    }),
};
