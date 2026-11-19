import { describe, expect, it } from 'vitest';

import {
  buildPriceFiltersQuery,
  clearConditions,
  countActiveFilters,
  parsePriceFilters,
  toPriceConditions,
  withRegion,
} from './price-filters';

describe('parsePriceFilters', () => {
  it('파라미터가 없으면 서울·경기·가격 낮은 순이다', () => {
    expect(parsePriceFilters({})).toEqual({
      region: 'metro',
      sort: 'price_asc',
    });
  });

  it('홈·검색에서 온 region 값을 그대로 받는다', () => {
    expect(parsePriceFilters({ region: 'gyeonggi' }).region).toBe('gyeonggi');
    expect(parsePriceFilters({ region: 'all' }).region).toBe('all');
  });

  it('모르는 값은 기본값으로 돌린다', () => {
    expect(
      parsePriceFilters({
        region: 'busan',
        sort: 'distance',
        institution: '<script>',
        sggu: 'abc',
      }),
    ).toEqual({ region: 'metro', sort: 'price_asc' });
  });

  it('같은 이름이 여러 번 오면 첫 값을 쓴다', () => {
    expect(parsePriceFilters({ region: ['seoul', 'gyeonggi'] }).region).toBe(
      'seoul',
    );
  });

  it('시군구는 서울이나 경기 하나를 골랐을 때 그 지역 것만 받는다', () => {
    expect(
      parsePriceFilters({ region: 'gyeonggi', sggu: '110001' }).sggu,
    ).toBeUndefined();
    expect(parsePriceFilters({ sggu: '110001' }).sggu).toBeUndefined();
    expect(
      parsePriceFilters({ region: 'all', sggu: '110001' }).sggu,
    ).toBeUndefined();
    expect(parsePriceFilters({ region: 'seoul', sggu: '110001' }).sggu).toBe(
      '110001',
    );
  });
});

describe('buildPriceFiltersQuery', () => {
  it('기본값은 빼고 쓴다', () => {
    expect(buildPriceFiltersQuery({ region: 'metro', sort: 'price_asc' })).toBe(
      '',
    );
  });

  it('파싱과 왕복해도 같은 필터가 된다', () => {
    const filters = parsePriceFilters({
      region: 'seoul',
      sggu: '110001',
      institution: '21',
      sort: 'price_desc',
    });
    const query = buildPriceFiltersQuery(filters);

    expect(query).toBe(
      'region=seoul&sggu=110001&institution=21&sort=price_desc',
    );
    expect(
      parsePriceFilters(Object.fromEntries(new URLSearchParams(query))),
    ).toEqual(filters);
  });
});

describe('toPriceConditions', () => {
  it('서울·경기는 시도별 조건 두 개다', () => {
    expect(
      toPriceConditions({
        region: 'metro',
        institution: '21',
        sort: 'price_asc',
      }),
    ).toEqual([
      { sidoCode: '110000', institutionCode: '21' },
      { sidoCode: '310000', institutionCode: '21' },
    ]);
  });

  it('전국은 조건이 없으면 빈 배열, 종별이 있으면 종별 조건 하나다', () => {
    expect(toPriceConditions({ region: 'all', sort: 'price_asc' })).toEqual([]);
    expect(
      toPriceConditions({
        region: 'all',
        institution: '11',
        sort: 'price_asc',
      }),
    ).toEqual([{ institutionCode: '11' }]);
  });

  it('한 지역은 시군구까지 한 조건에 담는다', () => {
    expect(
      toPriceConditions({
        region: 'seoul',
        sggu: '110001',
        sort: 'price_asc',
      }),
    ).toEqual([{ sidoCode: '110000', sgguCode: '110001' }]);
  });
});

describe('필터 조작', () => {
  it('지역을 바꾸면 시군구를 비운다', () => {
    expect(
      withRegion(
        { region: 'seoul', sggu: '110001', sort: 'price_asc' },
        'gyeonggi',
      ),
    ).toEqual({ region: 'gyeonggi', sort: 'price_asc' });
  });

  it('조건 수는 기본 지역과 정렬을 세지 않는다', () => {
    expect(
      countActiveFilters({
        region: 'seoul',
        sggu: '110001',
        institution: '21',
        sort: 'price_desc',
      }),
    ).toBe(3);
    expect(countActiveFilters({ region: 'metro', sort: 'price_desc' })).toBe(0);
  });

  it('조건을 비워도 정렬은 남긴다', () => {
    expect(
      clearConditions({
        region: 'all',
        institution: '21',
        sort: 'price_desc',
      }),
    ).toEqual({ region: 'metro', sort: 'price_desc' });
  });
});
