import { describe, expect, it } from 'vitest';

import {
  comparisonBasis,
  lowestOf,
  summarizeComparison,
} from './compare-basis';
import type { ComparisonHospital, ComparisonItem } from './queries';

const hospital = (ykiho: string): ComparisonHospital => ({
  ykiho,
  name: `${ykiho}병원`,
  className: null,
  sidoName: null,
  sgguName: null,
  address: null,
  phone: null,
});

const row = (...prices: [string, number | null][]): ComparisonItem => ({
  npayCode: 'X',
  itemName: '도수치료',
  categoryName: null,
  cheapestYkiho: null,
  prices: prices.map(([ykiho, minPrice]) => ({
    ykiho,
    minPrice,
    maxPrice: minPrice,
    priceCount: minPrice == null ? 0 : 1,
  })),
});

const hospitals = [hospital('A'), hospital('B'), hospital('C')];

describe('comparisonBasis', () => {
  it('모든 병원이 같은 이름의 세부 항목을 공개했으면 그 항목끼리 견준다', () => {
    const basis = comparisonBasis(
      row(['A', 1000], ['B', 50_000], ['C', 40_000]),
      hospitals,
      [
        [
          { name: '도수치료 [1일당] - N', price: 1000 },
          { name: '도수치료 30분', price: 90_000 },
        ],
        [
          { name: '도수치료  30분', price: 80_000 },
          { name: '도수치료R', price: 50_000 },
        ],
        [
          { name: '도수치료 30분', price: 70_000 },
          { name: '도수치료 30분', price: 75_000 },
          { name: '도수치료S', price: 40_000 },
        ],
      ],
    );
    expect(basis).toEqual({
      kind: 'sameVariant',
      excluded: [],
      entries: [
        { ykiho: 'A', price: 90_000, variant: '도수치료 30분' },
        { ykiho: 'B', price: 80_000, variant: '도수치료  30분' },
        { ykiho: 'C', price: 70_000, variant: '도수치료 30분' },
      ],
    });
  });

  it('같은 세부 항목이 없으면 병원별 가장 낮은 공개 가격과 그 이름을 쓴다', () => {
    expect(
      comparisonBasis(row(['A', 1000], ['B', 50_000]), hospitals, [
        [{ name: '도수치료 [1일당] - N', price: 1000 }],
        [{ name: '도수치료R', price: 50_000 }],
      ]),
    ).toEqual({
      kind: 'lowest',
      excluded: [],
      entries: [
        { ykiho: 'A', price: 1000, variant: '도수치료 [1일당] - N' },
        { ykiho: 'B', price: 50_000, variant: '도수치료R' },
      ],
    });
  });

  it('세부 항목을 아직 모르는 병원이 있으면 가장 낮은 가격으로 보고 이름은 비운다', () => {
    expect(
      comparisonBasis(row(['A', 1000], ['B', 50_000], ['C', null]), hospitals, [
        [{ name: '도수치료', price: 1000 }],
        undefined,
      ]),
    ).toEqual({
      kind: 'lowest',
      excluded: [],
      entries: [
        { ykiho: 'A', price: 1000, variant: '도수치료' },
        { ykiho: 'B', price: 50_000, variant: null },
      ],
    });
  });
});

describe('comparisonBasis with 평균 범위', () => {
  const band = { minPrice: 39_462, maxPrice: 355_152 };

  it('범위 밖 세부 항목(1일당 1,000원)은 기준으로 쓰지 않고 범위 안 가장 낮은 가격을 쓴다', () => {
    expect(
      comparisonBasis(
        row(['A', 1000], ['B', 50_000]),
        hospitals,
        [
          [
            { name: '도수치료 [1일당] - N', price: 1000 },
            { name: '도수치료 30분', price: 90_000 },
          ],
          [{ name: '도수치료R', price: 50_000 }],
        ],
        band,
      ),
    ).toEqual({
      kind: 'lowest',
      excluded: [],
      entries: [
        { ykiho: 'A', price: 90_000, variant: '도수치료 30분' },
        { ykiho: 'B', price: 50_000, variant: '도수치료R' },
      ],
    });
  });

  it('범위 안 가격이 하나도 없는 병원은 결론에서 빼고 알린다', () => {
    const basis = comparisonBasis(
      row(['A', 1000], ['B', 50_000], ['C', 60_000]),
      hospitals,
      [[{ name: '도수치료 [1일당] - N', price: 1000 }], undefined, undefined],
      band,
    );
    expect(basis.excluded).toEqual(['A']);
    expect(basis.entries.map((entry) => entry.ykiho)).toEqual(['B', 'C']);
  });

  it('같은 이름의 세부 항목도 범위 밖이면 그 항목으로 견주지 않는다', () => {
    expect(
      comparisonBasis(
        row(['A', 1000], ['B', 1200]),
        hospitals,
        [
          [
            { name: '1일당', price: 1000 },
            { name: '30분', price: 80_000 },
          ],
          [
            { name: '1일당', price: 1200 },
            { name: '30분', price: 70_000 },
          ],
        ],
        band,
      ).entries,
    ).toEqual([
      { ykiho: 'A', price: 80_000, variant: '30분' },
      { ykiho: 'B', price: 70_000, variant: '30분' },
    ]);
  });
});

describe('lowestOf', () => {
  const entry = (ykiho: string, price: number) => ({
    ykiho,
    price,
    variant: null,
  });

  it('가장 낮은 병원을 고르고, 하나뿐이거나 모두 같으면 고르지 않는다', () => {
    expect(lowestOf([entry('A', 2), entry('B', 1)])).toEqual(new Set(['B']));
    expect(lowestOf([entry('A', 1)])).toEqual(new Set());
    expect(lowestOf([entry('A', 1), entry('B', 1)])).toEqual(new Set());
  });
});

describe('summarizeComparison', () => {
  it('가장 낮은 병원 하나와 기준 가격, 세부 항목, 가장 높은 곳과의 차이를 낸다', () => {
    const basis = comparisonBasis(
      row(['A', 3000], ['B', 1000], ['C', 2000]),
      hospitals,
    );
    expect(summarizeComparison(basis, hospitals)).toEqual({
      kind: 'cheapest',
      basis: 'lowest',
      count: 3,
      ykiho: 'B',
      name: 'B병원',
      price: 1000,
      variant: null,
      gap: 2000,
    });
  });

  it('같은 세부 항목 기준이면 basis가 sameVariant다', () => {
    const basis = comparisonBasis(row(['A', 1000], ['B', 2000]), hospitals, [
      [{ name: '도수치료', price: 1000 }],
      [{ name: '도수치료', price: 2000 }],
    ]);
    expect(summarizeComparison(basis, hospitals)).toMatchObject({
      kind: 'cheapest',
      basis: 'sameVariant',
      ykiho: 'A',
      variant: '도수치료',
    });
  });

  it('가장 낮은 가격이 같은 병원이 여럿이면 tie, 모두 같으면 same이다', () => {
    expect(
      summarizeComparison(
        comparisonBasis(row(['A', 1000], ['B', 1000], ['C', 2000]), hospitals),
        hospitals,
      ),
    ).toEqual({ kind: 'tie', basis: 'lowest', count: 3, tied: 2, gap: 1000 });
    expect(
      summarizeComparison(
        comparisonBasis(row(['A', 1000], ['B', 1000]), hospitals),
        hospitals,
      ),
    ).toEqual({ kind: 'same', basis: 'lowest', count: 3 });
  });

  it('가격을 낸 병원이 2곳 미만이거나 비교 대상이 아니면 결론을 내지 않는다', () => {
    expect(
      summarizeComparison(
        comparisonBasis(row(['A', 1000], ['B', null]), hospitals),
        hospitals,
      ),
    ).toBeNull();
    expect(
      summarizeComparison(
        comparisonBasis(row(['A', 1000], ['Z', 500]), hospitals),
        hospitals,
      ),
    ).toBeNull();
  });
});
