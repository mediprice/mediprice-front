import { describe, expect, it } from 'vitest';

import { compareToAverage, hasRange, rangePosition } from './range-position';

describe('rangePosition', () => {
  it('평균이 없으면 최저 0, 최고 1, 사이는 비율이다', () => {
    const scale = { min: 1000, max: 5000 };
    expect(rangePosition(scale, 1000)).toBe(0);
    expect(rangePosition(scale, 5000)).toBe(1);
    expect(rangePosition(scale, 2000)).toBe(0.25);
    expect(rangePosition({ ...scale, average: null }, 2000)).toBe(0.25);
  });

  it('평균이 있으면 평균을 가운데에 두고 양쪽을 따로 나눈다', () => {
    const scale = { min: 1000, max: 9000, average: 3000 };
    expect(rangePosition(scale, 1000)).toBe(0);
    expect(rangePosition(scale, 2000)).toBe(0.25);
    expect(rangePosition(scale, 3000)).toBe(0.5);
    expect(rangePosition(scale, 6000)).toBe(0.75);
    expect(rangePosition(scale, 9000)).toBe(1);
  });

  it('극단값이 있어도 평균 근처의 값이 막대 가운데로 퍼진다', () => {
    const scale = { min: 1000, max: 500_000, average: 118_384 };
    expect(rangePosition(scale, 50_000)).toBeCloseTo(0.209, 3);
    expect(rangePosition(scale, 150_000)).toBeCloseTo(0.541, 3);
  });

  it('평균이 끝과 같거나 범위 밖이면 직선으로 놓는다', () => {
    expect(rangePosition({ min: 1000, max: 5000, average: 1000 }, 2000)).toBe(
      0.25,
    );
    expect(rangePosition({ min: 1000, max: 5000, average: 5000 }, 2000)).toBe(
      0.25,
    );
    expect(rangePosition({ min: 1000, max: 5000, average: 9000 }, 2000)).toBe(
      0.25,
    );
    expect(
      rangePosition({ min: 1000, max: 5000, average: Number.NaN }, 2000),
    ).toBe(0.25);
  });

  it('범위 밖 값은 끝에 붙인다', () => {
    const scale = { min: 1000, max: 5000, average: 2000 };
    expect(rangePosition(scale, 0)).toBe(0);
    expect(rangePosition(scale, 9000)).toBe(1);
  });

  it('최저와 최고가 같거나 뒤집혀 있으면 가운데로 둔다', () => {
    expect(rangePosition({ min: 3000, max: 3000 }, 3000)).toBe(0.5);
    expect(rangePosition({ min: 5000, max: 1000 }, 3000)).toBe(0.5);
  });

  it('숫자가 아닌 값은 가운데로 둔다', () => {
    expect(rangePosition({ min: 0, max: 100 }, Number.NaN)).toBe(0.5);
    expect(rangePosition({ min: 0, max: Number.POSITIVE_INFINITY }, 10)).toBe(
      0.5,
    );
  });
});

describe('hasRange', () => {
  it('최저와 최고가 모두 있고 다를 때만 막대를 그린다', () => {
    expect(hasRange(1000, 5000)).toBe(true);
    expect(hasRange(3000, 3000)).toBe(false);
    expect(hasRange(null, 5000)).toBe(false);
    expect(hasRange(1000, undefined)).toBe(false);
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
