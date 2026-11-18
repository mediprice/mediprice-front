import { describe, expect, it } from 'vitest';

import { compareToAverage, hasRange, rangePosition } from './range-position';

describe('rangePosition', () => {
  it('최저는 0, 최고는 1, 사이는 비율이다', () => {
    expect(rangePosition(1000, 5000, 1000)).toBe(0);
    expect(rangePosition(1000, 5000, 5000)).toBe(1);
    expect(rangePosition(1000, 5000, 2000)).toBe(0.25);
  });

  it('범위 밖 값은 끝에 붙인다', () => {
    expect(rangePosition(1000, 5000, 0)).toBe(0);
    expect(rangePosition(1000, 5000, 9000)).toBe(1);
  });

  it('최저와 최고가 같거나 뒤집혀 있으면 가운데로 둔다', () => {
    expect(rangePosition(3000, 3000, 3000)).toBe(0.5);
    expect(rangePosition(5000, 1000, 3000)).toBe(0.5);
  });

  it('숫자가 아닌 값은 가운데로 둔다', () => {
    expect(rangePosition(0, 100, Number.NaN)).toBe(0.5);
    expect(rangePosition(0, Number.POSITIVE_INFINITY, 10)).toBe(0.5);
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
  it('평균보다 낮음·같음·높음을 고른다', () => {
    expect(compareToAverage(900, 1000)).toBe('below');
    expect(compareToAverage(1000, 1000)).toBe('equal');
    expect(compareToAverage(1100, 1000)).toBe('above');
  });
});
