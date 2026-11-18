import { describe, expect, it } from 'vitest';

import { groupHistoryByDay, seoulDate } from './history-groups';
import type { ViewHistory } from './queries';

const entry = (id: number, viewedAt: string): ViewHistory => ({
  id,
  type: 'HOSPITAL',
  targetKey: `key-${id}`,
  title: `병원 ${id}`,
  viewedAt,
});

/** 서울 2026-11-19 10:00 */
const NOW = new Date('2026-11-19T01:00:00Z');

describe('seoulDate', () => {
  it('UTC 시각을 서울 날짜로 바꾼다', () => {
    expect(seoulDate('2026-11-18T14:59:59Z')).toBe('2026-11-18');
    expect(seoulDate('2026-11-18T15:00:00Z')).toBe('2026-11-19');
  });
});

describe('groupHistoryByDay', () => {
  it('서울 날짜로 오늘, 어제, 그 전을 나눈다', () => {
    const groups = groupHistoryByDay(
      [
        entry(1, '2026-11-19T00:30:00Z'),
        entry(2, '2026-11-18T15:10:00Z'),
        entry(3, '2026-11-18T14:50:00Z'),
        entry(4, '2026-11-15T03:00:00Z'),
      ],
      NOW,
    );
    expect(groups.map(({ date, day }) => ({ date, day }))).toEqual([
      { date: '2026-11-19', day: 'today' },
      { date: '2026-11-18', day: 'yesterday' },
      { date: '2026-11-15', day: 'earlier' },
    ]);
    expect(groups[0]?.entries.map(({ id }) => id)).toEqual([1, 2]);
    expect(groups[1]?.entries.map(({ id }) => id)).toEqual([3]);
  });

  it('순서가 섞여 와도 같은 날 기록은 한 묶음에 모은다', () => {
    const groups = groupHistoryByDay(
      [
        entry(1, '2026-11-19T00:30:00Z'),
        entry(2, '2026-11-10T00:00:00Z'),
        entry(3, '2026-11-19T00:10:00Z'),
      ],
      NOW,
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]?.entries.map(({ id }) => id)).toEqual([1, 3]);
  });

  it('기록이 없으면 빈 목록이다', () => {
    expect(groupHistoryByDay([], NOW)).toEqual([]);
  });
});
