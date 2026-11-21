import { z } from 'zod';

export const REPORT_STATUS_FILTERS = ['pending', 'resolved', 'all'] as const;
type ReportStatusFilter = (typeof REPORT_STATUS_FILTERS)[number];

/** URL의 page는 사람이 읽는 1부터, 백엔드는 0부터 센다. */
export type ReportFilters = { status: ReportStatusFilter; page: number };

const DEFAULT_REPORT_FILTERS: ReportFilters = {
  status: 'pending',
  page: 1,
};

/** 백엔드가 허용하는 page 범위 안에서 터무니없는 값을 막는다. */
const MAX_PAGE = 10_000;

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const searchSchema = z.object({
  status: z.preprocess(
    first,
    z.enum(REPORT_STATUS_FILTERS).catch(DEFAULT_REPORT_FILTERS.status),
  ),
  page: z.preprocess(
    first,
    z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE)
      .catch(DEFAULT_REPORT_FILTERS.page),
  ),
});

export function parseReportFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ReportFilters {
  return searchSchema.parse({
    status: searchParams.status,
    page: searchParams.page ?? DEFAULT_REPORT_FILTERS.page,
  });
}

/** 기본값은 링크에서 뺀다. */
export function buildReportFiltersQuery(filters: ReportFilters) {
  const params = new URLSearchParams();
  if (filters.status !== DEFAULT_REPORT_FILTERS.status) {
    params.set('status', filters.status);
  }
  if (filters.page !== DEFAULT_REPORT_FILTERS.page) {
    params.set('page', String(filters.page));
  }
  return params.toString();
}

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
