import { describe, expect, it } from 'vitest';

import { judgeAgainstAverage } from './average-verdict';

describe('judgeAgainstAverage', () => {
  it('평균의 1/3~3배 안이면 평균 대비 몇 % 차이인지 준다', () => {
    expect(judgeAgainstAverage(100_000, 118_384)).toEqual({
      kind: 'comparable',
      comparison: { direction: 'below', percent: 16 },
    });
    expect(judgeAgainstAverage(300_000, 118_384)).toEqual({
      kind: 'comparable',
      comparison: { direction: 'above', percent: 153 },
    });
    expect(judgeAgainstAverage(118_000, 118_384)).toEqual({
      kind: 'comparable',
      comparison: { direction: 'same', percent: 0 },
    });
  });

  it('1일당 1,000원이나 500,000원 패키지처럼 범위 밖이면 비교하지 않는다', () => {
    expect(judgeAgainstAverage(1_000, 118_384)).toEqual({
      kind: 'incomparable',
    });
    expect(judgeAgainstAverage(500_000, 118_384)).toEqual({
      kind: 'incomparable',
    });
  });

  it('경계(정확히 1/3, 3배)는 비교한다', () => {
    expect(judgeAgainstAverage(30_000, 90_000)?.kind).toBe('comparable');
    expect(judgeAgainstAverage(270_000, 90_000)?.kind).toBe('comparable');
  });

  it('평균이 없거나 0이면 판단하지 않는다', () => {
    expect(judgeAgainstAverage(1_000, null)).toBeNull();
    expect(judgeAgainstAverage(1_000, 0)).toBeNull();
    expect(judgeAgainstAverage(null, 1_000)).toBeNull();
  });
});
