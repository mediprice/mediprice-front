import { z } from 'zod/mini';

export type StorageKind = 'session' | 'local';

/** 사파리 비공개 창 등에서는 저장소에 접근만 해도 예외가 나므로, 쓸 수 없으면 `null`이다. */
export function safeStorage(kind: StorageKind): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function readItem(kind: StorageKind, key: string): string | null {
  try {
    return safeStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** 저장소가 가득 차거나 막혀 있으면 저장하지 않고 넘어간다. */
export function writeItem(kind: StorageKind, key: string, value: string) {
  try {
    safeStorage(kind)?.setItem(key, value);
  } catch {}
}

export function removeItem(kind: StorageKind, key: string) {
  try {
    safeStorage(kind)?.removeItem(key);
  } catch {}
}

/** 저장소 값은 사용자가 고쳤거나 다른 버전일 수 있어 검증하고, 없거나 틀리면 `null`이다. */
export function readJson<T>(
  kind: StorageKind,
  key: string,
  schema: z.core.$ZodType<T>,
): T | null {
  const raw = readItem(kind, key);
  if (!raw) return null;
  try {
    const parsed = z.safeParse(schema, JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeJson(kind: StorageKind, key: string, value: unknown) {
  try {
    safeStorage(kind)?.setItem(key, JSON.stringify(value));
  } catch {}
}
