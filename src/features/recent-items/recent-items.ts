import { z } from 'zod';

export type RecentItem = { code: string; name: string };

export const RECENT_ITEMS_KEY = 'mediprice:recent-items';
const RECENT_ITEMS_LIMIT = 3;

const recentItemsSchema = z.array(
  z.object({
    code: z.string().regex(/^[A-Za-z0-9]{1,20}$/),
    name: z.string().trim().min(1).max(100),
  }),
);

/** 저장소 값은 사용자가 고쳤거나 다른 버전일 수 있어 검증하고, 틀린 항목은 버린다. */
export function parseRecentItems(raw: string | null): RecentItem[] {
  if (!raw) return [];
  try {
    const parsed = recentItemsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.slice(0, RECENT_ITEMS_LIMIT) : [];
  } catch {
    return [];
  }
}

/** 방금 본 항목을 맨 앞에 두고, 같은 항목은 하나만 남긴다. */
export function pushRecentItem(
  items: readonly RecentItem[],
  item: RecentItem,
  limit = RECENT_ITEMS_LIMIT,
): RecentItem[] {
  return [item, ...items.filter((entry) => entry.code !== item.code)].slice(
    0,
    limit,
  );
}

type RecentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function browserStorage(): RecentStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** 다른 탭에서 바꾼 값(storage 이벤트)과 이 탭에서 바꾼 값을 함께 구독한다. */
export function subscribeRecentItems(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === RECENT_ITEMS_KEY) listener();
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function readRecentItemsRaw(storage = browserStorage()) {
  try {
    return storage?.getItem(RECENT_ITEMS_KEY) ?? null;
  } catch {
    return null;
  }
}

export function recordRecentItem(item: RecentItem, storage = browserStorage()) {
  const next = pushRecentItem(
    parseRecentItems(readRecentItemsRaw(storage)),
    item,
  );
  try {
    storage?.setItem(RECENT_ITEMS_KEY, JSON.stringify(next));
  } catch {}
  notify();
}

export function clearRecentItems(storage = browserStorage()) {
  try {
    storage?.removeItem(RECENT_ITEMS_KEY);
  } catch {}
  notify();
}
