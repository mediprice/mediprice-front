import { describe, expect, it } from 'vitest';

import {
  formatItemName,
  groupHeadingParts,
  groupItems,
  groupItemsByPages,
  partitionByPrice,
} from './item-groups';

function item(
  code: string,
  name: string,
  sdiv: [string, string] | null = ['1070Z050', '도수치료'],
) {
  return {
    code,
    name,
    mdivCode: '1070Z',
    mdivName: '이학요법료',
    sdivCode: sdiv?.[0] ?? null,
    sdivName: sdiv?.[1] ?? null,
  };
}

describe('formatItemName', () => {
  it('대분류 이름을 빼고 나머지 단계를 가운뎃점으로 잇는다', () => {
    expect(formatItemName(item('MX1220000', '이학요법료/도수치료'))).toBe(
      '도수치료',
    );
    expect(
      formatItemName({
        ...item('UB0010012', '치과의 보철료/치과임플란트(1치당)/PFM'),
        mdivName: '치과의 보철료',
      }),
    ).toBe('치과임플란트(1치당) · PFM');
  });

  it('대분류 자체인 항목은 이름을 그대로 쓴다', () => {
    expect(formatItemName(item('1070Z', '이학요법료'))).toBe('이학요법료');
  });
});

describe('groupItems', () => {
  it('중분류로 묶고 처음 나온 순서를 지키며, 대분류는 코드와 함께 둔다', () => {
    const groups = groupItems([
      item('A', '이학요법료/도수치료'),
      item('B', '이학요법료/증식치료', ['1070Z060', '증식치료']),
      item('C', '이학요법료/도수치료/척추'),
    ]);

    expect(groups.map((g) => g.key)).toEqual(['1070Z050', '1070Z060']);
    expect(groups[0]?.items.map((i) => i.code)).toEqual(['A', 'C']);
    expect(groups[0]?.major).toEqual({ code: '1070Z', name: '이학요법료' });
    expect(groups[0]?.minor).toEqual({ code: '1070Z050', name: '도수치료' });
  });

  it('중분류가 대분류와 같거나 없으면 중분류를 비운다', () => {
    const groups = groupItems([
      item('1070Z', '이학요법료', ['1070Z', '이학요법료']),
      item('X', '이학요법료/기타', null),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.minor).toBeNull();
    expect(groups[0]?.items.map((i) => i.code)).toEqual(['1070Z', 'X']);
  });
});

describe('groupHeadingParts', () => {
  const groups = groupItems([
    item('A', '이학요법료/도수치료/척추'),
    item('A2', '이학요법료/도수치료/사지'),
    item('B', '이학요법료/증식치료/관절', ['1070Z060', '증식치료']),
    item('X', '이학요법료/기타', null),
  ]);

  it('기본은 대분류와 중분류를 모두 둔다', () => {
    expect(groupHeadingParts(groups)[0]).toEqual({
      major: { code: '1070Z', name: '이학요법료' },
      minor: { code: '1070Z050', name: '도수치료' },
    });
  });

  it('모든 묶음이 같은 대분류면 대분류를 빼되, 중분류가 없는 묶음은 대분류를 남긴다', () => {
    const parts = groupHeadingParts(groups, { omitSharedMajor: true });
    expect(parts.map((part) => part?.major?.code ?? null)).toEqual([
      null,
      null,
      '1070Z',
    ]);
    expect(parts[1]?.minor?.name).toBe('증식치료');
  });

  it('항목 하나뿐인 묶음의 머리가 항목 이름과 같으면 머리를 없앤다', () => {
    const single = groupItems([
      item('A', '이학요법료/도수치료'),
      item('B', '이학요법료/증식치료/관절', ['1070Z060', '증식치료']),
    ]);
    const parts = groupHeadingParts(single, { omitSharedMajor: true });
    expect(parts[0]).toBeNull();
    expect(parts[1]?.minor?.name).toBe('증식치료');
    expect(groupHeadingParts(single)[0]).not.toBeNull();
  });

  it('대분류가 여럿이면 빼지 않는다', () => {
    const mixed = groupItems([
      item('A', '이학요법료/도수치료'),
      {
        ...item('E', '안과/라식', ['2Z96', '라식']),
        mdivCode: '2Z',
        mdivName: '안과',
      },
    ]);
    const parts = groupHeadingParts(mixed, { omitSharedMajor: true });
    expect(parts.map((part) => part?.major?.code)).toEqual(['1070Z', '2Z']);
  });
});

describe('partitionByPrice', () => {
  it('가격이 없다고 확인된 항목만 빼고, 모르는 항목은 남긴다', () => {
    const { priced, unpriced } = partitionByPrice([
      { code: 'A', hasPrice: false },
      { code: 'B', hasPrice: true },
      { code: 'C', hasPrice: null },
    ]);

    expect(priced.map((i) => i.code)).toEqual(['B', 'C']);
    expect(unpriced.map((i) => i.code)).toEqual(['A']);
  });
});

describe('groupItemsByPages', () => {
  const item = (code: string, sdivCode: string) => ({
    code,
    name: code,
    mdivCode: 'M',
    mdivName: '분야',
    sdivCode,
    sdivName: sdivCode,
  });

  it('새 페이지의 행은 이미 보여 준 묶음 사이로 끼어들지 않고 뒤에 붙는다', () => {
    const groups = groupItemsByPages([
      [item('a1', 'A'), item('b1', 'B')],
      [item('a2', 'A'), item('c1', 'C')],
    ]);
    expect(groups.map((group) => group.items.map((i) => i.code))).toEqual([
      ['a1'],
      ['b1'],
      ['a2'],
      ['c1'],
    ]);
    expect(new Set(groups.map((group) => group.key)).size).toBe(4);
  });

  it('새 페이지의 첫 묶음이 바로 앞 묶음과 같으면 이어 붙인다', () => {
    const groups = groupItemsByPages([
      [item('a1', 'A'), item('b1', 'B')],
      [item('b2', 'B'), item('c1', 'C')],
    ]);
    expect(groups.map((group) => group.items.map((i) => i.code))).toEqual([
      ['a1'],
      ['b1', 'b2'],
      ['c1'],
    ]);
  });
});
