import { describe, expect, it } from 'vitest';

import { measurePhase, readReviewModeration } from './review-moderation';

const base = { id: 1, status: 'ACTIVE', content: '후기' };

describe('readReviewModeration', () => {
  it('임시조치가 없는 공개 후기', () => {
    expect(readReviewModeration(base)).toEqual({
      status: 'ACTIVE',
      temporaryMeasure: null,
    });
  });

  it('생성 타입에 없는 상태와 temporaryMeasure를 읽는다', () => {
    expect(
      readReviewModeration({
        ...base,
        status: 'TEMPORARILY_HIDDEN',
        temporaryMeasure: {
          hiddenUntil: '2026-12-19T03:00:00.123456Z',
          reasons: ['PRIVACY', 'DEFAMATION', 'PRIVACY'],
          objectionAvailable: true,
        },
      }),
    ).toEqual({
      status: 'TEMPORARILY_HIDDEN',
      temporaryMeasure: {
        hiddenUntil: '2026-12-19T03:00:00.123456Z',
        reasons: ['DEFAMATION', 'PRIVACY'],
        objectionAvailable: true,
      },
    });
    expect(readReviewModeration({ ...base, status: 'DELETED' }).status).toBe(
      'DELETED',
    );
  });

  it('모르는 사유는 빼고, 모르는 상태는 공개로 보지 않는다', () => {
    const result = readReviewModeration({
      ...base,
      status: 'ARCHIVED',
      temporaryMeasure: {
        hiddenUntil: '2026-12-19T03:00:00Z',
        reasons: ['NEW_REASON', 'OTHER'],
        objectionAvailable: false,
      },
    });
    expect(result.status).toBe('HIDDEN');
    expect(result.temporaryMeasure?.reasons).toEqual(['OTHER']);
  });

  it('임시조치 정보가 깨져 있으면 없는 것으로 본다', () => {
    expect(
      readReviewModeration({
        ...base,
        status: 'TEMPORARILY_HIDDEN',
        temporaryMeasure: { hiddenUntil: '내일', reasons: [] },
      }).temporaryMeasure,
    ).toBeNull();
  });
});

describe('measurePhase', () => {
  const measure = {
    hiddenUntil: '2026-12-19T03:00:00Z',
    reasons: [],
    objectionAvailable: true,
  };

  it('기한 전이면 기한까지 가렸다고 알린다', () => {
    expect(measurePhase(measure, new Date('2026-11-19T00:00:00Z'))).toEqual({
      kind: 'hiddenUntil',
      until: new Date('2026-12-19T03:00:00Z'),
    });
  });

  it('기한이 지났거나 같으면 검토 중이다(처리 전까지 계속 가린다)', () => {
    expect(measurePhase(measure, new Date('2026-12-19T03:00:00Z'))).toEqual({
      kind: 'reviewing',
    });
    expect(measurePhase(measure, new Date('2027-01-01T00:00:00Z'))).toEqual({
      kind: 'reviewing',
    });
  });

  it('시간대가 붙은 기한도 같은 시각으로 비교한다', () => {
    expect(
      measurePhase(
        { ...measure, hiddenUntil: '2026-12-19T12:00:00+09:00' },
        new Date('2026-12-19T02:59:59Z'),
      ).kind,
    ).toBe('hiddenUntil');
  });
});
