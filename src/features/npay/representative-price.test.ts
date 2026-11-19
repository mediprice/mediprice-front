import { describe, expect, it } from 'vitest';

import type { HospitalPrice } from './price-stream';
import { representativeVariant } from './representative-price';

const variant = (itemName: string, price: number): HospitalPrice => ({
  ykiho: 'A',
  hospitalName: 'A병원',
  className: null,
  sidoName: null,
  sgguName: null,
  address: null,
  itemName,
  price,
  startDate: null,
});

describe('representativeVariant', () => {
  const variants = [
    variant('도수치료M1', 100_000),
    variant('도수치료F', 500_000),
    variant('도수치료R', 50_000),
  ];

  it('낮은 가격순이면 가장 낮은 세부 항목, 높은 가격순이면 가장 높은 것을 대표로 쓰고 반대쪽 끝을 함께 준다', () => {
    expect(representativeVariant(variants, 'price_asc')).toEqual({
      variant: variants[2],
      other: { kind: 'maximum', price: 500_000 },
    });
    expect(representativeVariant(variants, 'price_desc')).toEqual({
      variant: variants[1],
      other: { kind: 'minimum', price: 50_000 },
    });
  });

  it('같은 가격이면 먼저 나온 행을 쓰고, 가격이 하나면 반대쪽 끝이 없다', () => {
    const same = [variant('A', 3_000), variant('B', 3_000)];
    expect(representativeVariant(same, 'price_desc')).toEqual({
      variant: same[0],
      other: null,
    });
  });

  it('행이 없으면 null이다', () => {
    expect(representativeVariant([], 'price_asc')).toBeNull();
  });
});
