import { describe, expect, it } from 'vitest';

import { representativePrice } from './representative-price';

describe('representativePrice', () => {
  const group = { minPrice: 1_000, maxPrice: 5_000 };

  it('낮은 가격순이면 최저가, 높은 가격순이면 최고가를 대표로 쓰고 반대쪽 끝을 함께 준다', () => {
    expect(representativePrice(group, 'price_asc')).toEqual({
      price: 1_000,
      other: { kind: 'maximum', price: 5_000 },
    });
    expect(representativePrice(group, 'price_desc')).toEqual({
      price: 5_000,
      other: { kind: 'minimum', price: 1_000 },
    });
  });

  it('가격이 하나면 반대쪽 끝이 없다', () => {
    expect(
      representativePrice({ minPrice: 3_000, maxPrice: 3_000 }, 'price_desc'),
    ).toEqual({ price: 3_000, other: null });
  });
});
