import { describe, expect, it } from 'vitest';

import {
  cooldownKey,
  LIVE_FEE_COOLDOWN_MS,
  readCooldownUntil,
  secondsUntil,
  startCooldown,
} from './cooldown';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

const KEY = cooldownKey('Y1', 'MX1220000');
const NOW = 1_800_000_000_000;

describe('쿨다운', () => {
  it('확인을 시작하면 60초 동안 막고 남은 초를 올림으로 센다', () => {
    const storage = memoryStorage();

    const until = startCooldown(storage, KEY, NOW);

    expect(until).toBe(NOW + LIVE_FEE_COOLDOWN_MS);
    expect(readCooldownUntil(storage, KEY, NOW)).toBe(until);
    expect(secondsUntil(until, NOW)).toBe(60);
    expect(secondsUntil(until, NOW + 59_001)).toBe(1);
    expect(secondsUntil(until, NOW + 60_000)).toBe(0);
    expect(secondsUntil(until, NOW + 90_000)).toBe(0);
  });

  it('병원이나 항목이 다르면 따로 센다', () => {
    const storage = memoryStorage();
    startCooldown(storage, KEY, NOW);

    expect(
      readCooldownUntil(storage, cooldownKey('Y2', 'MX1220000'), NOW),
    ).toBe(0);
    expect(
      readCooldownUntil(storage, cooldownKey('Y1', 'MX1230000'), NOW),
    ).toBe(0);
  });

  it('저장한 값이 숫자가 아니거나 쿨다운보다 먼 미래면 무시한다', () => {
    const storage = memoryStorage();

    storage.setItem(KEY, 'abc');
    expect(readCooldownUntil(storage, KEY, NOW)).toBe(0);

    storage.setItem(KEY, String(NOW + LIVE_FEE_COOLDOWN_MS * 10));
    expect(readCooldownUntil(storage, KEY, NOW)).toBe(0);
  });

  it('저장소가 없거나 쓰기에 실패해도 쿨다운 시각은 돌려준다', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };

    expect(startCooldown(throwing, KEY, NOW)).toBe(NOW + LIVE_FEE_COOLDOWN_MS);
    expect(startCooldown(null, KEY, NOW)).toBe(NOW + LIVE_FEE_COOLDOWN_MS);
    expect(readCooldownUntil(null, KEY, NOW)).toBe(0);
  });
});
