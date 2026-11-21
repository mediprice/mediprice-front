import type { AdminClaim } from './claim-api';

const REASONS = [
  'DEFAMATION',
  'PRIVACY',
  'FALSE_FACT',
  'COPYRIGHT',
  'OTHER',
] as const;
const ROLES = ['SELF', 'HOSPITAL', 'AGENT'] as const;

function oneOf<T extends string>(values: readonly T[], value: string) {
  return values.find((candidate) => candidate === value);
}

export function claimReasonKey(reason: string) {
  return oneOf(REASONS, reason) ?? 'unknown';
}

export function claimantRoleKey(role: string) {
  return oneOf(ROLES, role) ?? 'unknown';
}

export type ClaimOutcome =
  'pending' | 'overdue' | 'restored' | 'keptHidden' | 'deleted';

/** 기한 지난 대기(EXPIRED_PENDING)는 따로 보여 먼저 처리하게 한다. */
export function claimOutcome(
  claim: Pick<AdminClaim, 'status' | 'action'>,
): ClaimOutcome {
  if (claim.status === 'PENDING') return 'pending';
  if (claim.status === 'EXPIRED_PENDING') return 'overdue';
  if (claim.action === 'RESTORE') return 'restored';
  if (claim.action === 'DELETE_REVIEW') return 'deleted';
  return 'keptHidden';
}

export function isClaimActive(claim: Pick<AdminClaim, 'status'>) {
  return claim.status !== 'RESOLVED';
}
