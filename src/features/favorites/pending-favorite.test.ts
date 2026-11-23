import { beforeEach, describe, expect, it } from 'vitest';

import { savePendingFavorite, takePendingFavorite } from './pending-favorite';

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

const pending = {
  ykiho: 'Y1',
  name: '가나병원',
  path: '/hospitals/Y1',
  scrollY: 320,
};

describe('pending favorite', () => {
  beforeEach(() => store.clear());

  it('같은 화면으로 곧 돌아오면 한 번만 꺼낸다', () => {
    savePendingFavorite(pending, 1000);
    expect(takePendingFavorite('/hospitals/Y1', 2000)).toMatchObject(pending);
    expect(takePendingFavorite('/hospitals/Y1', 2000)).toBeNull();
  });

  it('다른 화면이거나 15분이 지났으면 버린다', () => {
    savePendingFavorite(pending, 0);
    expect(takePendingFavorite('/', 1000)).toBeNull();
    savePendingFavorite(pending, 0);
    expect(takePendingFavorite('/hospitals/Y1', 16 * 60 * 1000)).toBeNull();
  });
});
