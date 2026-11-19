import { describe, expect, it } from 'vitest';

import {
  claimantRoleKey,
  claimOutcome,
  claimReasonKey,
  isClaimActive,
} from './claim-labels';

describe('claimOutcome', () => {
  it.each([
    ['PENDING', null, 'pending'],
    ['EXPIRED_PENDING', null, 'overdue'],
    ['RESOLVED', 'RESTORE', 'restored'],
    ['RESOLVED', 'KEEP_HIDDEN', 'keptHidden'],
    ['RESOLVED', 'DELETE_REVIEW', 'deleted'],
  ] as const)('%s·%s는 %s다', (status, action, outcome) => {
    expect(claimOutcome({ status, action })).toBe(outcome);
  });

  it('처리 전(대기·기한 지남)만 처리할 수 있다', () => {
    expect(isClaimActive({ status: 'PENDING' })).toBe(true);
    expect(isClaimActive({ status: 'EXPIRED_PENDING' })).toBe(true);
    expect(isClaimActive({ status: 'RESOLVED' })).toBe(false);
  });
});

describe('라벨 키', () => {
  it('모르는 사유·구분은 unknown이다', () => {
    expect(claimReasonKey('COPYRIGHT')).toBe('COPYRIGHT');
    expect(claimReasonKey('SPAM')).toBe('unknown');
    expect(claimantRoleKey('AGENT')).toBe('AGENT');
    expect(claimantRoleKey('LAWYER')).toBe('unknown');
  });
});
