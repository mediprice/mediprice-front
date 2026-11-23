import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod/mini';

import {
  readItem,
  readJson,
  removeItem,
  safeStorage,
  writeItem,
  writeJson,
} from './safe-storage';

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

function setWindow(value: object) {
  Object.defineProperty(globalThis, 'window', { value, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
});

describe('safe storage', () => {
  it('서버에서는 저장소가 없다', () => {
    expect(safeStorage('session')).toBeNull();
    expect(readItem('local', 'k')).toBeNull();
    expect(() => writeItem('local', 'k', 'v')).not.toThrow();
  });

  it('저장소에 접근만 해도 예외가 나는 브라우저에서는 없는 것으로 본다', () => {
    setWindow({
      get sessionStorage() {
        throw new Error('SecurityError');
      },
    });
    expect(safeStorage('session')).toBeNull();
    expect(readJson('session', 'k', z.string())).toBeNull();
    expect(() => removeItem('session', 'k')).not.toThrow();
  });

  it('session과 local을 나눠 쓴다', () => {
    setWindow({
      sessionStorage: memoryStorage(),
      localStorage: memoryStorage(),
    });
    writeItem('session', 'k', 's');
    writeItem('local', 'k', 'l');
    expect(readItem('session', 'k')).toBe('s');
    expect(readItem('local', 'k')).toBe('l');
    removeItem('session', 'k');
    expect(readItem('session', 'k')).toBeNull();
    expect(readItem('local', 'k')).toBe('l');
  });

  it('JSON 값은 스키마에 맞을 때만 돌려준다', () => {
    setWindow({ sessionStorage: memoryStorage() });
    const schema = z.object({ n: z.number() });
    writeJson('session', 'ok', { n: 1 });
    writeItem('session', 'wrong', '{"n":"1"}');
    writeItem('session', 'broken', '{');
    expect(readJson('session', 'ok', schema)).toEqual({ n: 1 });
    expect(readJson('session', 'wrong', schema)).toBeNull();
    expect(readJson('session', 'broken', schema)).toBeNull();
    expect(readJson('session', 'missing', schema)).toBeNull();
  });

  it('쓰기가 막혀 있으면 조용히 넘어간다', () => {
    setWindow({
      localStorage: {
        ...memoryStorage(),
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      },
    });
    expect(() => writeJson('local', 'k', { a: 1 })).not.toThrow();
    expect(readItem('local', 'k')).toBeNull();
  });
});
