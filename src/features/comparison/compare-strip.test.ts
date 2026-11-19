import { describe, expect, it } from 'vitest';

import { comparisonBasis } from './compare-basis';
import {
  clusterStripMarkers,
  stripDomain,
  stripMarkers,
  subjectParticle,
} from './compare-strip';
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

describe('stripDomain', () => {
  it('병원 값만 있으면 그 최저와 최고를 양 끝으로 쓴다', () => {
    expect(stripDomain([3000, null, 1000, 2000])).toEqual({
      min: 1000,
      max: 3000,
    });
  });

  it('지역 범위가 있으면 병원 값이 밖에 있을 때만 넓힌다', () => {
    expect(stripDomain([5000, 8000], { min: 2000, max: 10000 })).toEqual({
      min: 2000,
      max: 10000,
    });
    expect(stripDomain([500, 8000], { min: 2000, max: 10000 })).toEqual({
      min: 500,
      max: 10000,
    });
  });

  it('값이 하나뿐이거나 모두 같으면 막대를 그리지 않는다', () => {
    expect(stripDomain([1000])).toBeNull();
    expect(stripDomain([1000, 1000, null])).toBeNull();
    expect(stripDomain([])).toBeNull();
  });
});

describe('subjectParticle', () => {
  it('받침이 있으면 consonant, 없으면 vowel이다', () => {
    expect(subjectParticle('서울병원')).toBe('consonant');
    expect(subjectParticle('바른정형외과')).toBe('vowel');
    expect(subjectParticle('밝은 치과의원')).toBe('consonant');
  });

  it('끝의 괄호 덧말은 빼고 본다', () => {
    expect(subjectParticle('바른정형외과(강남점)')).toBe('vowel');
    expect(subjectParticle('서울의원 [본원]')).toBe('consonant');
  });

  it('숫자는 읽는 소리로 고른다', () => {
    expect(subjectParticle('클리닉365')).toBe('vowel');
    expect(subjectParticle('센터 1')).toBe('consonant');
  });

  it('한글·숫자가 아니면 unknown이다', () => {
    expect(subjectParticle('ABC Clinic')).toBe('unknown');
    expect(subjectParticle('')).toBe('unknown');
  });
});

describe('stripMarkers', () => {
  const hospitals = [hospital('A'), hospital('B'), hospital('C')];

  it('열 순서대로 번호를 매기고 가격 없는 병원은 점을 빼며 최저를 표시한다', () => {
    const basis = comparisonBasis(
      row(['C', 1000], ['A', 3000], ['B', null]),
      hospitals,
    );
    expect(stripMarkers(basis, hospitals)).toEqual([
      { id: 'A', number: 1, value: 3000, isLowest: false },
      { id: 'C', number: 3, value: 1000, isLowest: true },
    ]);
  });
});

describe('clusterStripMarkers', () => {
  const marker = (number: number, isLowest = false) => ({
    id: String(number),
    number,
    value: number,
    isLowest,
  });

  it('충분히 떨어진 점은 따로 둔다', () => {
    expect(
      clusterStripMarkers([marker(1, true), marker(2)], [0.1, 0.8], 0.1),
    ).toEqual([
      { id: '1', numbers: [1], position: 0.1, isLowest: true },
      { id: '2', numbers: [2], position: 0.8, isLowest: false },
    ]);
  });

  it('가까운 점은 번호를 합친 점 하나로 묶고 가운데에 둔다', () => {
    const [cluster] = clusterStripMarkers(
      [marker(3), marker(1, true), marker(2)],
      [0.04, 0, 0.02],
      0.1,
    );
    expect(cluster?.numbers).toEqual([1, 2, 3]);
    expect(cluster?.position).toBeCloseTo(0.02);
    expect(cluster?.isLowest).toBe(true);
  });

  it('같은 값의 점은 늘 묶인다', () => {
    expect(
      clusterStripMarkers([marker(2), marker(3)], [0.5, 0.5], 0.1),
    ).toEqual([{ id: '2', numbers: [2, 3], position: 0.5, isLowest: false }]);
  });

  it('묶은 가운데가 다음 점과 가까우면 다시 묶는다', () => {
    const clusters = clusterStripMarkers(
      [marker(1), marker(2), marker(3)],
      [0, 0.08, 0.13],
      0.1,
    );
    expect(clusters.map((c) => c.numbers)).toEqual([[1, 2, 3]]);
  });
});
