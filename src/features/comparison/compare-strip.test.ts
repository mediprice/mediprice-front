import { describe, expect, it } from 'vitest';

import {
  assignLanes,
  groupStripMarkers,
  rowStrip,
  stripDomain,
  stripMarkers,
  subjectParticle,
  summarizeComparison,
} from './compare-strip';
import type { ComparisonHospital, ComparisonItem } from './queries';

const hospital = (
  ykiho: string,
  name = `${ykiho}병원`,
): ComparisonHospital => ({
  ykiho,
  name,
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

describe('assignLanes', () => {
  it('충분히 떨어진 점은 모두 첫 줄에 둔다', () => {
    expect(assignLanes([0, 0.5, 1], 0.1)).toEqual([0, 0, 0]);
  });

  it('가까운 점은 다음 줄로 올리고 입력 순서대로 돌려준다', () => {
    expect(assignLanes([0.52, 0.5, 1], 0.1)).toEqual([1, 0, 0]);
  });

  it('같은 위치의 점 셋은 줄 셋으로 나눈다', () => {
    expect(assignLanes([0.3, 0.3, 0.3], 0.1)).toEqual([0, 1, 2]);
  });

  it('윗줄이 비면 다시 첫 줄을 쓴다', () => {
    expect(assignLanes([0, 0.05, 0.2], 0.1)).toEqual([0, 1, 0]);
  });
});

describe('summarizeComparison', () => {
  const hospitals = [hospital('A'), hospital('B'), hospital('C')];

  it('가장 싼 병원 하나와 가장 비싼 곳과의 차이를 낸다', () => {
    expect(
      summarizeComparison(
        row(['A', 3000], ['B', 1000], ['C', 2000]),
        hospitals,
      ),
    ).toEqual({
      kind: 'cheapest',
      count: 3,
      ykiho: 'B',
      name: 'B병원',
      gap: 2000,
    });
  });

  it('최저가가 같은 병원이 여럿이면 공동 최저로 본다', () => {
    expect(
      summarizeComparison(
        row(['A', 1000], ['B', 1000], ['C', 2000]),
        hospitals,
      ),
    ).toEqual({ kind: 'tie', count: 3, tied: 2, gap: 1000 });
  });

  it('모두 같은 가격이면 same이다', () => {
    expect(
      summarizeComparison(row(['A', 1000], ['B', 1000]), hospitals),
    ).toEqual({ kind: 'same', count: 3 });
  });

  it('가격을 낸 병원이 2곳 미만이거나 비교 대상이 아니면 결론을 내지 않는다', () => {
    expect(
      summarizeComparison(row(['A', 1000], ['B', null]), hospitals),
    ).toBeNull();
    expect(
      summarizeComparison(row(['A', 1000], ['Z', 500]), hospitals),
    ).toBeNull();
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

describe('stripMarkers와 rowStrip', () => {
  const hospitals = [hospital('A'), hospital('B'), hospital('C')];

  it('열 순서대로 번호를 매기고 가격 없는 병원은 점을 빼며 최저를 표시한다', () => {
    expect(
      stripMarkers(row(['C', 1000], ['A', 3000], ['B', null]), hospitals),
    ).toEqual([
      { id: 'A', number: 1, value: 3000, isLowest: false },
      { id: 'C', number: 3, value: 1000, isLowest: true },
    ]);
  });

  it('점이 둘 이상이고 값이 다를 때만 막대를 만든다', () => {
    expect(rowStrip(row(['A', 1000], ['B', 3000]), hospitals)).toEqual({
      domain: { min: 1000, max: 3000 },
      markers: [
        { id: 'A', number: 1, value: 1000, isLowest: true },
        { id: 'B', number: 2, value: 3000, isLowest: false },
      ],
    });
    expect(rowStrip(row(['A', 1000], ['B', 1000]), hospitals)).toBeNull();
    expect(rowStrip(row(['A', 1000], ['B', null]), hospitals)).toBeNull();
  });
});

describe('groupStripMarkers', () => {
  it('같은 값의 점을 하나로 합치고 번호를 모은다', () => {
    expect(
      groupStripMarkers([
        { id: 'A', number: 1, value: 1000, isLowest: true },
        { id: 'B', number: 2, value: 3000, isLowest: false },
        { id: 'C', number: 3, value: 3000, isLowest: false },
      ]),
    ).toEqual([
      { id: 'A', numbers: [1], value: 1000, isLowest: true },
      { id: 'B', numbers: [2, 3], value: 3000, isLowest: false },
    ]);
  });
});
