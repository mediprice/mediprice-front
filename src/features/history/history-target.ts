import type { ViewHistory, ViewTargetType } from './queries';

export type HistoryFilter = 'all' | ViewTargetType;

export const HISTORY_FILTERS = [
  'all',
  'HOSPITAL',
  'NPAY_ITEM',
  'KEYWORD',
] as const satisfies readonly HistoryFilter[];

/** 병원·항목의 제목이 비었으면 배치로 대상이 사라진 것이다. 검색어는 키가 곧 제목이라 사라지지 않는다. */
export function isTargetGone(entry: ViewHistory) {
  return entry.type !== 'KEYWORD' && !entry.title;
}

/** 다시 볼 화면. 대상이 사라졌으면 null이다. 검색어 기록은 병원 검색에서만 쌓인다. */
export function historyTargetHref(entry: ViewHistory) {
  const key = encodeURIComponent(entry.targetKey);
  if (isTargetGone(entry)) return null;
  switch (entry.type) {
    case 'HOSPITAL':
      return `/hospitals/${key}` as const;
    case 'NPAY_ITEM':
      return `/items/${key}` as const;
    case 'KEYWORD':
      return `/search?type=hospital&q=${key}` as const;
  }
}

export function filterHistory(
  entries: readonly ViewHistory[],
  filter: HistoryFilter,
) {
  return filter === 'all'
    ? entries
    : entries.filter((entry) => entry.type === filter);
}

export function countHistoryByFilter(entries: readonly ViewHistory[]) {
  const counts: Record<HistoryFilter, number> = {
    all: entries.length,
    HOSPITAL: 0,
    NPAY_ITEM: 0,
    KEYWORD: 0,
  };
  for (const entry of entries) counts[entry.type] += 1;
  return counts;
}
