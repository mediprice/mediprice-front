'use client';

import { useEffect, useSyncExternalStore } from 'react';

import {
  parseRecentItems,
  readRecentItemsRaw,
  type RecentItem,
  recordRecentItem,
  subscribeRecentItems,
} from './recent-items';

let cachedRaw: string | null = null;
let cachedItems: RecentItem[] = [];
const EMPTY: RecentItem[] = [];

/** 같은 저장값이면 같은 배열을 돌려줘 useSyncExternalStore가 다시 그리지 않게 한다. */
function snapshot() {
  const raw = readRecentItemsRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parseRecentItems(raw);
  }
  return cachedItems;
}

/** 이 기기에만 남긴 최근 본 항목. 서버 렌더와 첫 렌더는 빈 목록이다. */
export function useRecentItems() {
  return useSyncExternalStore(subscribeRecentItems, snapshot, () => EMPTY);
}

/** 항목 화면을 열면 이름을 안 뒤 한 번 남긴다. 로그인 기록(최근 기록)과는 별개로 기기 안에만 둔다. */
export function useRecordRecentItem(item: RecentItem | null) {
  const code = item?.code;
  const name = item?.name;
  useEffect(() => {
    if (code && name) recordRecentItem({ code, name });
  }, [code, name]);
}
