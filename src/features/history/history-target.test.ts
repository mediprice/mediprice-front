import { describe, expect, it } from 'vitest';

import {
  countHistoryByFilter,
  filterHistory,
  historyTargetHref,
  isTargetGone,
} from './history-target';
import type { ViewHistory } from './queries';

const entry = (
  id: number,
  type: ViewHistory['type'],
  targetKey: string,
  title: string | null = `제목 ${id}`,
): ViewHistory => ({
  id,
  type,
  targetKey,
  title,
  viewedAt: '2026-10-28T03:00:00Z',
});

describe('historyTargetHref', () => {
  it('종류마다 다시 볼 화면으로 보낸다', () => {
    expect(historyTargetHref(entry(1, 'HOSPITAL', 'JDQ4MTYyMiM4MSMk'))).toBe(
      '/hospitals/JDQ4MTYyMiM4MSMk',
    );
    expect(historyTargetHref(entry(2, 'NPAY_ITEM', 'MX121'))).toBe(
      '/items/MX121',
    );
    expect(historyTargetHref(entry(3, 'KEYWORD', '도수 치료&재활'))).toBe(
      '/search?type=hospital&q=%EB%8F%84%EC%88%98%20%EC%B9%98%EB%A3%8C%26%EC%9E%AC%ED%99%9C',
    );
  });

  it('병원 키의 특수문자를 경로에 맞게 인코딩한다', () => {
    expect(historyTargetHref(entry(1, 'HOSPITAL', 'a/b#c'))).toBe(
      '/hospitals/a%2Fb%23c',
    );
  });

  it('제목이 없는 병원·항목은 사라진 대상이라 링크가 없다', () => {
    const gone = entry(1, 'HOSPITAL', 'H1', null);

    expect(isTargetGone(gone)).toBe(true);
    expect(historyTargetHref(gone)).toBeNull();
    expect(isTargetGone(entry(2, 'KEYWORD', '정형외과', null))).toBe(false);
  });
});

describe('filterHistory', () => {
  const entries = [
    entry(1, 'HOSPITAL', 'H1'),
    entry(2, 'KEYWORD', '정형외과'),
    entry(3, 'HOSPITAL', 'H2'),
  ];

  it('전체는 그대로, 종류를 고르면 그 종류만 순서대로 남긴다', () => {
    expect(filterHistory(entries, 'all')).toEqual(entries);
    expect(filterHistory(entries, 'HOSPITAL').map(({ id }) => id)).toEqual([
      1, 3,
    ]);
    expect(filterHistory(entries, 'NPAY_ITEM')).toEqual([]);
  });

  it('종류별 개수를 센다', () => {
    expect(countHistoryByFilter(entries)).toEqual({
      all: 3,
      HOSPITAL: 2,
      NPAY_ITEM: 0,
      KEYWORD: 1,
    });
  });
});
