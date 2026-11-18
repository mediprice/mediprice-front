import { describe, expect, it } from 'vitest';

import { groupPricesByHospital } from './group-prices';
import type { HospitalPrice } from './price-stream';

function row(ykiho: string, price: number, itemName = '도수치료') {
  return {
    ykiho,
    hospitalName: `${ykiho}병원`,
    className: '병원',
    sidoName: '서울',
    sgguName: '강남구',
    address: null,
    itemName,
    price,
    startDate: '2026-09-03',
  } satisfies HospitalPrice;
}

describe('groupPricesByHospital', () => {
  it('병원별로 묶고 처음 나온 순서를 지킨다', () => {
    const groups = groupPricesByHospital([
      row('a', 1000),
      row('b', 2000),
      row('a', 3000, '도수치료 30분'),
      row('c', 4000),
    ]);

    expect(groups.map((g) => g.ykiho)).toEqual(['a', 'b', 'c']);
    expect(groups[0]?.variants.map((v) => v.itemName)).toEqual([
      '도수치료',
      '도수치료 30분',
    ]);
  });

  it('병원의 최저·최고가를 세부 행에서 구한다', () => {
    const [group] = groupPricesByHospital([
      row('a', 90000),
      row('a', 40000),
      row('a', 60000),
    ]);

    expect(group).toMatchObject({ minPrice: 40000, maxPrice: 90000 });
  });

  it('"더 보기"로 늘어난 행을 다시 묶으면 기존 카드에 합쳐진다', () => {
    const page1 = [row('a', 1000), row('b', 2000)];
    const page2 = [row('a', 5000), row('c', 6000)];

    const groups = groupPricesByHospital([...page1, ...page2]);

    expect(groups).toHaveLength(3);
    expect(groups[0]).toMatchObject({
      ykiho: 'a',
      minPrice: 1000,
      maxPrice: 5000,
    });
  });

  it('빈 목록은 빈 배열이다', () => {
    expect(groupPricesByHospital([])).toEqual([]);
  });
});
