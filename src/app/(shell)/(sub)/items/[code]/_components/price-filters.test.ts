import { describe, expect, it } from 'vitest';

import { formatItemTitle } from './item-title';
import {
  buildPriceFiltersQuery,
  clearConditions,
  countActiveFilters,
  parsePriceFilters,
  toPriceCondition,
  withRegion,
} from './price-filters';

describe('parsePriceFilters', () => {
  it('파라미터가 없으면 전체 지역·가격 낮은 순이다', () => {
    expect(parsePriceFilters({})).toEqual({
      region: 'all',
      sort: 'price_asc',
    });
  });

  it('홈·검색에서 온 region 값을 그대로 받는다', () => {
    expect(parsePriceFilters({ region: 'gyeonggi' }).region).toBe('gyeonggi');
  });

  it('모르는 값은 기본값으로 돌린다', () => {
    expect(
      parsePriceFilters({
        region: 'busan',
        sort: 'distance',
        institution: '<script>',
        sggu: 'abc',
      }),
    ).toEqual({ region: 'all', sort: 'price_asc' });
  });

  it('같은 이름이 여러 번 오면 첫 값을 쓴다', () => {
    expect(parsePriceFilters({ region: ['seoul', 'gyeonggi'] }).region).toBe(
      'seoul',
    );
  });

  it('지역과 맞지 않는 시군구는 버린다', () => {
    expect(
      parsePriceFilters({ region: 'gyeonggi', sggu: '110001' }).sggu,
    ).toBeUndefined();
    expect(parsePriceFilters({ sggu: '110001' }).sggu).toBeUndefined();
    expect(parsePriceFilters({ region: 'seoul', sggu: '110001' }).sggu).toBe(
      '110001',
    );
  });
});

describe('buildPriceFiltersQuery', () => {
  it('기본값은 빼고 쓴다', () => {
    expect(buildPriceFiltersQuery({ region: 'all', sort: 'price_asc' })).toBe(
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

describe('toPriceCondition', () => {
  it('지역을 시도 코드로 바꾸고 없는 조건은 넣지 않는다', () => {
    expect(toPriceCondition({ region: 'all', sort: 'price_asc' })).toEqual({});
    expect(
      toPriceCondition({
        region: 'seoul',
        sggu: '110001',
        institution: '21',
        sort: 'price_asc',
      }),
    ).toEqual({
      sidoCode: '110000',
      sgguCode: '110001',
      institutionCode: '21',
    });
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

  it('조건 수는 정렬을 세지 않는다', () => {
    expect(
      countActiveFilters({
        region: 'seoul',
        sggu: '110001',
        institution: '21',
        sort: 'price_desc',
      }),
    ).toBe(3);
    expect(countActiveFilters({ region: 'all', sort: 'price_desc' })).toBe(0);
  });

  it('조건을 비워도 정렬은 남긴다', () => {
    expect(
      clearConditions({
        region: 'seoul',
        institution: '21',
        sort: 'price_desc',
      }),
    ).toEqual({ region: 'all', sort: 'price_desc' });
  });
});

describe('formatItemTitle', () => {
  it('대분류 경로를 빼고 나머지를 가운뎃점으로 잇는다', () => {
    expect(
      formatItemTitle({
        name: '이학요법료/도수치료',
        mdivName: '이학요법료',
      }),
    ).toBe('도수치료');
    expect(
      formatItemTitle({
        name: '치과의 보철료/치과임플란트(1치당)/PFM',
        mdivName: '치과의 보철료',
      }),
    ).toBe('치과임플란트(1치당) · PFM');
  });

  it('대분류와 이름이 같으면 이름을 그대로 쓴다', () => {
    expect(
      formatItemTitle({
        name: '자기공명영상진단료(MRI-기본검사)',
        mdivName: '자기공명영상진단료(MRI-기본검사)',
      }),
    ).toBe('자기공명영상진단료(MRI-기본검사)');
  });
});
