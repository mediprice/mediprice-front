import { beforeEach, describe, expect, it } from 'vitest';

import { savePendingLocation, takePendingLocation } from './pending-location';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'window', {
  value: {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  },
  configurable: true,
});

describe('pending location', () => {
  beforeEach(() => store.clear());

  it('같은 경로로 곧 돌아오면 한 번만 꺼낸다', () => {
    savePendingLocation('/map', 1000);
    expect(takePendingLocation('/map', 2000)).toBe(true);
    expect(takePendingLocation('/map', 2000)).toBe(false);
  });

  it('다른 경로이거나 15분이 지났으면 버린다', () => {
    savePendingLocation('/map', 0);
    expect(takePendingLocation('/', 1000)).toBe(false);
    savePendingLocation('/map', 0);
    expect(takePendingLocation('/map', 16 * 60 * 1000)).toBe(false);
  });

  it('깨진 값이면 버린다', () => {
    store.set('mediprice:pending-location', '{not json');
    expect(takePendingLocation('/map', 1000)).toBe(false);
  });
});
