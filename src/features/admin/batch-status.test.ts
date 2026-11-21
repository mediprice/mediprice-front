import { describe, expect, it } from 'vitest';

import {
  batchDuration,
  batchStatusKey,
  batchStatusTone,
  parseBatchTime,
} from './batch-status';

describe('batchStatusKey·batchStatusTone', () => {
  it('완료는 정상, 실행 중 상태는 진행, 나머지는 경고다', () => {
    expect(batchStatusTone('COMPLETED')).toBe('positive');
    expect(batchStatusTone('STARTED')).toBe('running');
    expect(batchStatusTone('STOPPING')).toBe('running');
    expect(batchStatusTone('FAILED')).toBe('warning');
    expect(batchStatusTone('ABANDONED')).toBe('warning');
    expect(batchStatusTone(null)).toBe('warning');
  });

  it('모르는 상태는 UNKNOWN, 상태가 없으면 none이다', () => {
    expect(batchStatusKey('FAILED')).toBe('FAILED');
    expect(batchStatusKey('PAUSED')).toBe('UNKNOWN');
    expect(batchStatusKey(null)).toBe('none');
  });
});

describe('parseBatchTime', () => {
  it('시간대 없는 시각을 벽시계 그대로 UTC로 읽는다', () => {
    expect(parseBatchTime('2026-11-19T03:04:05')?.toISOString()).toBe(
      '2026-11-19T03:04:05.000Z',
    );
    expect(parseBatchTime('2026-11-19T03:04:05.123456')?.getUTCHours()).toBe(3);
  });

  it('비었거나 형식이 다르면 null이다', () => {
    expect(parseBatchTime(null)).toBeNull();
    expect(parseBatchTime('')).toBeNull();
    expect(parseBatchTime('2026-11-19T03:04:05Z')).toBeNull();
    expect(parseBatchTime('어제')).toBeNull();
    expect(parseBatchTime('2026-13-45T99:00:00')).toBeNull();
  });
});

describe('batchDuration', () => {
  const at = (value: string) => parseBatchTime(value);

  it('분과 초로 나눈다', () => {
    expect(
      batchDuration(at('2026-11-19T03:00:00'), at('2026-11-19T03:12:07')),
    ).toEqual({ minutes: 12, seconds: 7 });
    expect(
      batchDuration(at('2026-11-19T03:00:00'), at('2026-11-19T03:00:42')),
    ).toEqual({ minutes: 0, seconds: 42 });
  });

  it('끝나지 않았거나 순서가 뒤집혔으면 null이다', () => {
    expect(batchDuration(at('2026-11-19T03:00:00'), null)).toBeNull();
    expect(
      batchDuration(at('2026-11-19T03:00:10'), at('2026-11-19T03:00:00')),
    ).toBeNull();
  });
});
