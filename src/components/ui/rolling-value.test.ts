import { describe, expect, it } from 'vitest';

import { rollingValueAt } from './rolling-value';

describe('rollingValueAt', () => {
  it('처음은 시작값, 끝은 목표값이다', () => {
    expect(rollingValueAt(0, 0, 118384)).toBe(0);
    expect(rollingValueAt(1, 0, 118384)).toBe(118384);
  });

  it('진행률이 범위를 벗어나도 시작값과 목표값 사이에 머문다', () => {
    expect(rollingValueAt(-1, 0, 100)).toBe(0);
    expect(rollingValueAt(2, 0, 100)).toBe(100);
  });

  it('앞쪽에서 빨리 오르고 끝으로 갈수록 느려진다', () => {
    const half = rollingValueAt(0.5, 0, 1000);
    expect(half).toBeGreaterThan(500);
    expect(half).toBeLessThan(1000);
  });

  it('값은 항상 정수다', () => {
    for (const progress of [0.1, 0.33, 0.77]) {
      expect(Number.isInteger(rollingValueAt(progress, 0, 12345))).toBe(true);
    }
  });

  it('줄어드는 방향도 같은 방식으로 움직인다', () => {
    expect(rollingValueAt(0, 500, 100)).toBe(500);
    expect(rollingValueAt(1, 500, 100)).toBe(100);
    expect(rollingValueAt(0.5, 500, 100)).toBeLessThan(300);
  });

  it('값이 바뀌면 이전 값에서 시작해 새 값으로 간다', () => {
    expect(rollingValueAt(0, 118384, 95000)).toBe(118384);
    expect(rollingValueAt(0.5, 118384, 95000)).toBeLessThan(118384);
    expect(rollingValueAt(0.5, 118384, 95000)).toBeGreaterThan(95000);
    expect(rollingValueAt(1, 118384, 95000)).toBe(95000);
  });
});
