import type { AdminReport } from './queries';

const REASONS = ['PRIVACY', 'SPAM', 'ABUSE', 'FALSE_INFO', 'ETC'] as const;
type ReasonKey = (typeof REASONS)[number] | 'unknown';

const REVIEW_STATUSES = [
  'ACTIVE',
  'HIDDEN',
  'TEMPORARILY_HIDDEN',
  'DELETED',
] as const;
type ReviewStatusKey = (typeof REVIEW_STATUSES)[number] | 'unknown';

export type ReportOutcome = 'pending' | 'hidden' | 'dismissed' | 'resolved';

function oneOf<T extends string>(values: readonly T[], value: string) {
  return values.find((candidate) => candidate === value);
}

/** 응답 스키마가 사유를 문자열로만 알려 줘서, 새 사유가 생겨도 화면이 깨지지 않게 unknown으로 받는다. */
export function reportReasonKey(reason: string): ReasonKey {
  return oneOf(REASONS, reason) ?? 'unknown';
}

export function reviewStatusKey(status: string): ReviewStatusKey {
  return oneOf(REVIEW_STATUSES, status) ?? 'unknown';
}

export function reportOutcome(
  report: Pick<AdminReport, 'status' | 'action'>,
): ReportOutcome {
  if (report.status === 'PENDING') return 'pending';
  if (report.action === 'HIDE_REVIEW') return 'hidden';
  if (report.action === 'DISMISS') return 'dismissed';
  return 'resolved';
}
