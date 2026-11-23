import { describe, expect, it } from 'vitest';

import { hasRange, rangePosition } from './range-position';

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
