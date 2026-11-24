import { describe, expect, it } from 'vitest';

import { msUntilNextStage, waitStage } from './wait-stage';

describe('waitStage', () => {
  it('8초 전에는 점만, 8초부터 걸리는 시간을, 30초부터 계속 기다릴지 묻는다', () => {
    expect(waitStage(0)).toBe('quiet');
    expect(waitStage(7_999)).toBe('quiet');
    expect(waitStage(8_000)).toBe('slow');
    expect(waitStage(29_999)).toBe('slow');
    expect(waitStage(30_000)).toBe('long');
  });

  it('다음 단계까지 남은 시간을 알려 주고, 마지막 단계면 null이다', () => {
    expect(msUntilNextStage(3_000)).toBe(5_000);
    expect(msUntilNextStage(10_000)).toBe(20_000);
    expect(msUntilNextStage(30_000)).toBeNull();
  });
});
