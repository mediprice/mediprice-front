import { describe, expect, it } from 'vitest';

import {
  reportOutcome,
  reportReasonKey,
  reviewStatusKey,
} from './report-labels';

describe('reportOutcome', () => {
  it('대기 중이면 처리 방법과 관계없이 대기다', () => {
    expect(reportOutcome({ status: 'PENDING', action: null })).toBe('pending');
  });

  it('처리한 신고는 처리 방법으로 나눈다', () => {
    expect(reportOutcome({ status: 'RESOLVED', action: 'HIDE_REVIEW' })).toBe(
      'hidden',
    );
    expect(reportOutcome({ status: 'RESOLVED', action: 'DISMISS' })).toBe(
      'dismissed',
    );
  });

  it('처리 방법을 모르면 처리됨으로만 보여 준다', () => {
    expect(reportOutcome({ status: 'RESOLVED', action: null })).toBe(
      'resolved',
    );
    expect(reportOutcome({ status: 'RESOLVED', action: 'ESCALATE' })).toBe(
      'resolved',
    );
  });
});

describe('사유·후기 상태 키', () => {
  it('아는 값은 그대로, 모르는 값은 unknown이다', () => {
    expect(reportReasonKey('FALSE_INFO')).toBe('FALSE_INFO');
    expect(reportReasonKey('COPYRIGHT')).toBe('unknown');
    expect(reviewStatusKey('HIDDEN')).toBe('HIDDEN');
    expect(reviewStatusKey('DELETED')).toBe('unknown');
  });
});
