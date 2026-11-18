import { describe, expect, it } from 'vitest';

import { formatItemName, groupItems, partitionByPrice } from './item-groups';

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
