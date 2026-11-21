import { describe, expect, it } from 'vitest';

import {
  clearRecentItems,
  parseRecentItems,
  pushRecentItem,
  RECENT_ITEMS_KEY,
  recordRecentItem,
} from './recent-items';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

describe('pushRecentItem', () => {
  it('방금 본 항목을 맨 앞에 두고 같은 항목은 하나만 남긴다', () => {
    const list = [
      { code: 'A', name: '가' },
      { code: 'B', name: '나' },
    ];
    expect(pushRecentItem(list, { code: 'B', name: '나' })).toEqual([
      { code: 'B', name: '나' },
      { code: 'A', name: '가' },
    ]);
  });

  it('세 개까지만 남긴다', () => {
    const list = [
      { code: 'A', name: '가' },
      { code: 'B', name: '나' },
      { code: 'C', name: '다' },
    ];
    expect(
      pushRecentItem(list, { code: 'D', name: '라' }).map((item) => item.code),
    ).toEqual(['D', 'A', 'B']);
  });
});

describe('parseRecentItems', () => {
  it('틀린 값이나 JSON이 아니면 빈 목록이다', () => {
    expect(parseRecentItems(null)).toEqual([]);
    expect(parseRecentItems('not json')).toEqual([]);
    expect(parseRecentItems('[{"code":"<script>","name":"x"}]')).toEqual([]);
  });

  it('맞는 값은 그대로 읽는다', () => {
    expect(
      parseRecentItems('[{"code":"MX1220000","name":"도수치료"}]'),
    ).toEqual([{ code: 'MX1220000', name: '도수치료' }]);
  });
});

describe('recordRecentItem / clearRecentItems', () => {
  it('저장소에 남기고 지운다', () => {
    const storage = memoryStorage();
    recordRecentItem({ code: 'A', name: '가' }, storage);
    recordRecentItem({ code: 'B', name: '나' }, storage);
    expect(parseRecentItems(storage.getItem(RECENT_ITEMS_KEY))).toEqual([
      { code: 'B', name: '나' },
      { code: 'A', name: '가' },
    ]);
    clearRecentItems(storage);
    expect(storage.getItem(RECENT_ITEMS_KEY)).toBeNull();
  });
});
