import { describe, expect, it } from 'vitest';

import {
  comparableBand,
  compareToAverage,
  judgeAgainstAverage,
} from './average-verdict';

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

describe('comparableBand', () => {
  it('평균의 1/3 이상 3배 이하를 원 단위로 준다', () => {
    expect(comparableBand(118_384)).toEqual({
      minPrice: 39_462,
      maxPrice: 355_152,
    });
    expect(comparableBand(90_000)).toEqual({
      minPrice: 30_000,
      maxPrice: 270_000,
    });
  });

  it('범위 끝의 가격은 비교 가능하고 바로 밖은 아니다', () => {
    const band = comparableBand(118_384);
    expect(judgeAgainstAverage(band?.minPrice, 118_384)?.kind).toBe(
      'comparable',
    );
    expect(judgeAgainstAverage((band?.minPrice ?? 0) - 1, 118_384)?.kind).toBe(
      'incomparable',
    );
    expect(judgeAgainstAverage(band?.maxPrice, 118_384)?.kind).toBe(
      'comparable',
    );
  });

  it('평균이 없거나 0이면 범위도 없다', () => {
    expect(comparableBand(null)).toBeNull();
    expect(comparableBand(0)).toBeNull();
  });
});

describe('compareToAverage', () => {
  it('평균보다 싸면 몇 % 싼지 반올림해 돌려준다', () => {
    expect(compareToAverage(44_000, 50_000)).toEqual({
      direction: 'below',
      percent: 12,
    });
    expect(compareToAverage(33_333, 50_000)).toEqual({
      direction: 'below',
      percent: 33,
    });
  });

  it('평균보다 비싸면 몇 % 비싼지 돌려주고 100%를 넘어도 그대로 쓴다', () => {
    expect(compareToAverage(54_000, 50_000)).toEqual({
      direction: 'above',
      percent: 8,
    });
    expect(compareToAverage(150_000, 50_000)).toEqual({
      direction: 'above',
      percent: 200,
    });
  });

  it('5% 미만의 차이는 평균 수준으로 보고, 경계(정확히 5%)부터는 차이로 본다', () => {
    const same = { direction: 'same', percent: 0 };
    expect(compareToAverage(50_000, 50_000)).toEqual(same);
    expect(compareToAverage(104_900, 100_000)).toEqual(same);
    expect(compareToAverage(95_500, 100_000)).toEqual(same);
    expect(compareToAverage(95_000, 100_000)).toEqual({
      direction: 'below',
      percent: 5,
    });
    expect(compareToAverage(105_000, 100_000)).toEqual({
      direction: 'above',
      percent: 5,
    });
  });

  it('0원이 아니면 100% 싸다고 말하지 않는다', () => {
    expect(compareToAverage(1, 50_000)).toEqual({
      direction: 'below',
      percent: 99,
    });
    expect(compareToAverage(0, 50_000)).toEqual({
      direction: 'below',
      percent: 100,
    });
  });

  it('평균이나 가격이 없거나 쓸 수 없는 값이면 null이다', () => {
    expect(compareToAverage(null, 50_000)).toBeNull();
    expect(compareToAverage(40_000, null)).toBeNull();
    expect(compareToAverage(40_000, undefined)).toBeNull();
    expect(compareToAverage(40_000, 0)).toBeNull();
    expect(compareToAverage(-1, 50_000)).toBeNull();
    expect(compareToAverage(Number.NaN, 50_000)).toBeNull();
    expect(compareToAverage(40_000, Number.POSITIVE_INFINITY)).toBeNull();
  });
});
