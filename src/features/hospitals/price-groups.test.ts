import { describe, expect, it } from 'vitest';

import { groupPriceRows, lastSegment, priceRowName } from './price-groups';

const row = (
  npayCode: string,
  categoryName: string | null,
  hospitalItemName: string | null,
  price = 1000,
) => ({
  npayCode,
  itemName: `${categoryName ?? '기타'}/중분류/${npayCode}표준`,
  categoryName,
  hospitalItemName,
  price,
  startDate: '2026-09-03',
});

describe('lastSegment', () => {
  it('분류 경로의 마지막 조각만 남긴다', () => {
    expect(lastSegment('예방접종료/대상포진/스카이조스터주')).toBe(
      '스카이조스터주',
    );
    expect(lastSegment('도수치료')).toBe('도수치료');
    expect(lastSegment('이학요법료/도수치료/ ')).toBe('도수치료');
  });
});

describe('priceRowName', () => {
  it('병원이 붙인 이름을 먼저 쓰고 없으면 표준 이름의 마지막 조각을 쓴다', () => {
    expect(priceRowName(row('A', '주사료', ' 비타민 '))).toBe('비타민');
    expect(priceRowName(row('A', '주사료', null))).toBe('A표준');
  });
});

describe('groupPriceRows', () => {
  it('분류가 처음 나온 순서대로 묶는다', () => {
    const groups = groupPriceRows([
      row('A', '주사료', 'a'),
      row('B', '이학요법료', 'b'),
      row('C', '주사료', 'c'),
      row('D', null, 'd'),
    ]);

    expect(groups.map((g) => g.category)).toEqual([
      '주사료',
      '이학요법료',
      null,
    ]);
    expect(groups[0]?.rows.map((r) => r.npayCode)).toEqual(['A', 'C']);
  });

  it('선택한 항목의 분류를 맨 앞에 두고 그 항목 행을 중복 없이 위로 올린다', () => {
    const groups = groupPriceRows(
      [
        row('A', '주사료', 'a'),
        row('B', '이학요법료', 'b1'),
        row('X', '이학요법료', 'x'),
      ],
      {
        npayCode: 'B',
        rows: [row('B', '이학요법료', 'b1'), row('B', '이학요법료', 'b2')],
      },
    );

    expect(groups.map((g) => g.category)).toEqual(['이학요법료', '주사료']);
    expect(groups[0]?.rows.map((r) => r.hospitalItemName)).toEqual([
      'b1',
      'b2',
      'x',
    ]);
  });
});
