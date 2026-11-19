import { describe, expect, it } from 'vitest';

import {
  findLowest,
  formatComparisonItemName,
  groupComparisonItems,
  latestDate,
  orderHospitals,
} from './compare-rows';
import type { ComparisonHospital, ComparisonItem } from './queries';

const cell = (ykiho: string, minPrice: number | null, maxPrice = minPrice) => ({
  ykiho,
  minPrice,
  maxPrice,
  priceCount: minPrice == null ? 0 : 1,
});

const item = (
  npayCode: string,
  categoryName: string | null,
): ComparisonItem => ({
  npayCode,
  itemName: `${categoryName ?? '기타'}/${npayCode}`,
  categoryName,
  prices: [],
  cheapestYkiho: null,
});

describe('findLowest', () => {
  it('가장 낮은 최저가를 낸 병원을 고른다', () => {
    expect(
      findLowest([cell('A', 3000), cell('B', 1000, 9000), cell('C', 2000)]),
    ).toEqual(new Set(['B']));
  });

  it('같은 최저가가 여럿이면 모두 고른다', () => {
    expect(
      findLowest([cell('A', 1000), cell('B', 1000), cell('C', 2000)]),
    ).toEqual(new Set(['A', 'B']));
  });

  it('모두 같거나 가격이 하나뿐이면 표시하지 않는다', () => {
    expect(findLowest([cell('A', 1000), cell('B', 1000)]).size).toBe(0);
    expect(findLowest([cell('A', 1000), cell('B', null)]).size).toBe(0);
    expect(findLowest([]).size).toBe(0);
  });
});

describe('formatComparisonItemName', () => {
  it('분류 경로를 떼고 나머지를 가운뎃점으로 잇는다', () => {
    expect(
      formatComparisonItemName({
        itemName: '제증명수수료/상해진단서/3주 미만',
        categoryName: '제증명수수료',
      }),
    ).toBe('상해진단서 · 3주 미만');
    expect(
      formatComparisonItemName({
        itemName: '이학요법료/도수치료',
        categoryName: '이학요법료',
      }),
    ).toBe('도수치료');
  });

  it('분류가 앞에 없으면 이름 전체를 쓴다', () => {
    expect(
      formatComparisonItemName({ itemName: '도수치료', categoryName: null }),
    ).toBe('도수치료');
  });
});

describe('groupComparisonItems', () => {
  it('분류별로 묶고 처음 나온 순서를 지킨다', () => {
    const groups = groupComparisonItems([
      item('A1', '가'),
      item('B1', '나'),
      item('A2', '가'),
      item('C1', null),
    ]);
    expect(
      groups.map((g) => [g.category, g.items.map((i) => i.npayCode)]),
    ).toEqual([
      ['가', ['A1', 'A2']],
      ['나', ['B1']],
      [null, ['C1']],
    ]);
  });

  it('limit개 항목만 남긴다', () => {
    const groups = groupComparisonItems(
      [item('A1', '가'), item('B1', '나'), item('A2', '가')],
      2,
    );
    expect(groups.flatMap((g) => g.items.map((i) => i.npayCode))).toEqual([
      'A1',
      'B1',
    ]);
  });
});

describe('orderHospitals', () => {
  it('주소 순서로 맞추고 응답에 없는 병원은 뺀다', () => {
    const hospital = (ykiho: string) =>
      ({ ykiho, name: ykiho }) as ComparisonHospital;
    expect(
      orderHospitals([hospital('B'), hospital('A')], ['A', 'X', 'B']).map(
        (h) => h.ykiho,
      ),
    ).toEqual(['A', 'B']);
  });
});

describe('latestDate', () => {
  it('가장 최근 날짜를 고르고 없으면 null이다', () => {
    expect(latestDate(['2026-09-03', null, '2026-10-01', '2025-01-01'])).toBe(
      '2026-10-01',
    );
    expect(latestDate([null, undefined])).toBeNull();
  });
});
