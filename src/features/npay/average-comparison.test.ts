import { describe, expect, it } from 'vitest';

import { compareToAverage } from './average-comparison';

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

  it('반올림해 0%면 평균과 같다고 본다', () => {
    expect(compareToAverage(50_000, 50_000)).toEqual({
      direction: 'same',
      percent: 0,
    });
    expect(compareToAverage(50_200, 50_000)).toEqual({
      direction: 'same',
      percent: 0,
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

  it('sameWithinPercent 미만의 차이는 같다고 보고, 경계(정확히 그 값)부터는 차이로 본다', () => {
    const near = { sameWithinPercent: 5 };
    expect(compareToAverage(104_900, 100_000, near)).toEqual({
      direction: 'same',
      percent: 0,
    });
    expect(compareToAverage(95_500, 100_000, near)).toEqual({
      direction: 'same',
      percent: 0,
    });
    expect(compareToAverage(95_000, 100_000, near)).toEqual({
      direction: 'below',
      percent: 5,
    });
    expect(compareToAverage(105_000, 100_000, near)).toEqual({
      direction: 'above',
      percent: 5,
    });
  });
});
