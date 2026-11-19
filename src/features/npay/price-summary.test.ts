import { describe, expect, it } from 'vitest';

import { mergeSummaries } from './price-summary';

const summary = (
  minPrice: number | null,
  maxPrice: number | null,
  avgPrice: number | null,
  priceCount: number,
  hospitalCount: number,
) => ({
  npayCode: 'X',
  minPrice,
  maxPrice,
  avgPrice,
  priceCount,
  hospitalCount,
});

describe('mergeSummaries', () => {
  it('최저·최고를 고르고 평균은 가격 수로 가중한다', () => {
    const merged = mergeSummaries('X', [
      summary(10_000, 50_000, 30_000, 3, 2),
      summary(20_000, 90_000, 60_000, 1, 1),
    ]);

    expect(merged).toEqual({
      npayCode: 'X',
      minPrice: 10_000,
      maxPrice: 90_000,
      avgPrice: 37_500,
      priceCount: 4,
      hospitalCount: 3,
    });
  });

  it('가격이 없는 시도는 범위와 평균에서 뺀다', () => {
    const merged = mergeSummaries('X', [
      summary(null, null, null, 0, 0),
      summary(5_000, 5_000, 5_000, 2, 1),
    ]);

    expect(merged.minPrice).toBe(5_000);
    expect(merged.avgPrice).toBe(5_000);
  });

  it('모두 비어 있으면 가격 없음으로 둔다', () => {
    expect(
      mergeSummaries('X', [summary(null, null, null, 0, 0)]),
    ).toMatchObject({
      minPrice: null,
      maxPrice: null,
      avgPrice: null,
      priceCount: 0,
    });
  });
});
