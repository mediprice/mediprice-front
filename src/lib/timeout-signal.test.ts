import { afterEach, describe, expect, it, vi } from 'vitest';

import { timeoutSignal } from './timeout-signal';

afterEach(() => {
  vi.useRealTimers();
});

describe('timeoutSignal', () => {
  it('시간이 지나면 끊긴다', () => {
    vi.useFakeTimers();
    const { signal } = timeoutSignal(1000);
    vi.advanceTimersByTime(999);
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(1);
    expect(signal.aborted).toBe(true);
  });

  it('바깥 신호가 끊기면 같은 이유로 바로 끊긴다', () => {
    const parent = new AbortController();
    const { signal } = timeoutSignal(1000, parent.signal);
    parent.abort('cancelled');
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe('cancelled');
  });

  it('이미 끊긴 바깥 신호를 받으면 처음부터 끊겨 있다', () => {
    const { signal } = timeoutSignal(1000, AbortSignal.abort('gone'));
    expect(signal.aborted).toBe(true);
  });

  it('clear 뒤에는 시간이 지나도 바깥 신호가 끊겨도 그대로다', () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    const { signal, clear } = timeoutSignal(1000, parent.signal);
    clear();
    vi.advanceTimersByTime(2000);
    parent.abort();
    expect(signal.aborted).toBe(false);
  });
});
