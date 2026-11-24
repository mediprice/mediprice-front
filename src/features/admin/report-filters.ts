import { createQueueFilters, type QueueFilters } from './queue-filters';

export const REPORT_STATUS_FILTERS = ['pending', 'resolved', 'all'] as const;
type ReportStatusFilter = (typeof REPORT_STATUS_FILTERS)[number];

export type ReportFilters = QueueFilters<ReportStatusFilter>;

const reportFilters = createQueueFilters(REPORT_STATUS_FILTERS, 'pending');

export const parseReportFilters = reportFilters.parse;
export const buildReportFiltersQuery = reportFilters.buildQuery;

const STATUS_CONDITION = {
  pending: 'PENDING',
  resolved: 'RESOLVED',
  all: undefined,
} as const satisfies Record<ReportStatusFilter, string | undefined>;

export function toReportsRequest(filters: ReportFilters, size: number) {
  const status = STATUS_CONDITION[filters.status];
  return {
    condition: status ? { status } : {},
    pageQuery: { page: filters.page - 1, size },
  };
}
