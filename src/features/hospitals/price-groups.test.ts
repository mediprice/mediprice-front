import { describe, expect, it } from 'vitest';

import {
  groupPriceRows,
  lastSegment,
  pickVariantRow,
  priceRowName,
  sortVariantRows,
  splitTrailingUnit,
  visibleVariantRows,
} from './price-groups';

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

describe('splitTrailingUnit', () => {
  it('마지막 짧은 조각을 떼어 낸다', () => {
    expect(splitTrailingUnit('도수치료5[1일당]-N 20분')).toEqual([
      '도수치료5[1일당]-N ',
      '20분',
    ]);
  });

  it('띄어쓰기가 없거나 마지막 조각이 길면 나누지 않는다', () => {
    expect(splitTrailingUnit('스카이조스')).toEqual(['스카이조스', '']);
    expect(splitTrailingUnit('A 아주아주긴마지막조각입니다')).toEqual([
      'A 아주아주긴마지막조각입니다',
      '',
    ]);
  });
});

describe('sortVariantRows', () => {
  it('낮은 가격부터 두고 같은 값은 받은 순서를 지킨다', () => {
    const rows = [
      row('X', null, 'B', 3000),
      row('X', null, 'A', 1000),
      row('X', null, 'C', 3000),
    ];
    expect(sortVariantRows(rows).map((r) => r.hospitalItemName)).toEqual([
      'A',
      'B',
      'C',
    ]);
  });
});

describe('pickVariantRow', () => {
  const rows = [
    row('X', null, '도수치료R', 50_000),
    row('X', null, '도수치료', 300_000),
    row('X', null, '도수치료', 360_000),
    row('X', null, '도수치료F', 500_000),
  ];

  it('이름과 가격이 모두 맞는 행을 먼저 고른다', () => {
    expect(pickVariantRow(rows, { name: '도수치료', price: 360_000 })).toBe(
      rows[2],
    );
    expect(pickVariantRow(rows, { name: ' 도수치료F ', price: 500_000 })).toBe(
      rows[3],
    );
  });

  it('가격이 바뀌었거나 없으면 이름만 맞는 첫 행, 이름도 없으면 맨 앞 행이다', () => {
    expect(pickVariantRow(rows, { name: '도수치료', price: 1 })).toBe(rows[1]);
    expect(pickVariantRow(rows, { name: '도수치료', price: null })).toBe(
      rows[1],
    );
    expect(pickVariantRow(rows, { name: '없음', price: 1 })).toBe(rows[0]);
    expect(pickVariantRow(rows, null)).toBe(rows[0]);
    expect(pickVariantRow([], null)).toBeUndefined();
  });
});

describe('visibleVariantRows', () => {
  const rows = ['a', 'b', 'c', 'd', 'e'];

  it('앞에서 limit개를 보여 준다', () => {
    expect(visibleVariantRows(rows, 'b', 3)).toEqual(['a', 'b', 'c']);
    expect(visibleVariantRows(rows, undefined, 3)).toEqual(['a', 'b', 'c']);
  });

  it('고른 행이 뒤에 있으면 마지막 자리를 그 행에 준다', () => {
    expect(visibleVariantRows(rows, 'e', 3)).toEqual(['a', 'b', 'e']);
  });
});
