import type { ViewHistory } from './queries';

type HistoryDay = 'today' | 'yesterday' | 'earlier';

export type HistoryGroup = {
  /** 서울 날짜(YYYY-MM-DD). 묶음의 key와 날짜 표시에 쓴다. */
  date: string;
  day: HistoryDay;
  entries: ViewHistory[];
};

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 한국은 일광 절약 시간이 없어 UTC+9로 서울 날짜를 구한다(Intl 없이 서버와 브라우저 결과가 같다). */
export function seoulDate(time: Date | string) {
  const ms = typeof time === 'string' ? Date.parse(time) : time.getTime();
  return new Date(ms + SEOUL_OFFSET_MS).toISOString().slice(0, 10);
}

/** 기록을 본 날(서울 기준)로 묶는다. 순서는 받은 순서(최근 먼저)를 그대로 따른다. */
export function groupHistoryByDay(
  entries: readonly ViewHistory[],
  now: Date = new Date(),
): HistoryGroup[] {
  const today = seoulDate(now);
  const yesterday = seoulDate(new Date(now.getTime() - DAY_MS));
  const groups: HistoryGroup[] = [];
  for (const entry of entries) {
    const date = seoulDate(entry.viewedAt);
    const last = groups.at(-1);
    if (last?.date === date) {
      last.entries.push(entry);
      continue;
    }
    const existing = groups.find((group) => group.date === date);
    if (existing) {
      existing.entries.push(entry);
      continue;
    }
    groups.push({
      date,
      day:
        date === today ? 'today' : date === yesterday ? 'yesterday' : 'earlier',
      entries: [entry],
    });
  }
  return groups;
}
