import { describe, expect, it } from 'vitest';

import {
  parseSearchParams,
  regionSidoCode,
  regionSidoCodes,
  withRegion,
} from './search-params';

describe('parseSearchParams', () => {
  it('검색어가 있으면 검색 대상(type)에 따라 항목·병원 검색이다', () => {
    expect(parseSearchParams({ q: ' 도수치료 ', region: 'seoul' })).toEqual({
      mode: 'item',
      keyword: '도수치료',
      region: 'seoul',
    });
    expect(parseSearchParams({ type: 'hospital', q: '정형외과' })).toEqual({
      mode: 'hospital',
      keyword: '정형외과',
      region: 'all',
    });
  });

  it('검색어가 없고 분류가 있으면 분류 탐색이다', () => {
    expect(parseSearchParams({ category: 'physio', code: '1070Z050' })).toEqual(
      {
        mode: 'category',
        category: 'physio',
        code: '1070Z050',
        region: 'all',
      },
    );
  });

  it('검색어와 분류가 함께 오면 검색어가 우선한다', () => {
    expect(parseSearchParams({ q: '도수', category: 'all' }).mode).toBe('item');
  });

  it('아무 조건도 없으면 입력 안내다', () => {
    expect(parseSearchParams({ type: 'hospital', q: '   ' })).toEqual({
      mode: 'prompt',
      type: 'hospital',
      region: 'all',
    });
  });

  it('잘못된 값은 기본값으로 바꾸고, 여러 번 온 값은 첫 값을 쓴다', () => {
    expect(
      parseSearchParams({
        type: 'doctor',
        q: ['라식', '라섹'],
        region: 'busan',
      }),
    ).toEqual({ mode: 'item', keyword: '라식', region: 'all' });
    expect(
      parseSearchParams({ category: '<script>', code: 'drop table' }),
    ).toEqual({ mode: 'prompt', type: 'item', region: 'all' });
  });

  it('검색어는 100자까지만 쓴다', () => {
    const state = parseSearchParams({ q: '가'.repeat(150) });
    expect(state.mode === 'item' && state.keyword.length).toBe(100);
  });
});

describe('지역', () => {
  it('전체는 시도 조건 없이 조회한다', () => {
    expect(regionSidoCodes('all')).toEqual([]);
    expect(regionSidoCodes('gyeonggi')).toEqual(['310000']);
    expect(regionSidoCode('all')).toBeUndefined();
    expect(regionSidoCode('seoul')).toBe('110000');
  });

  it('링크에는 기본값이 아닌 지역만 붙인다', () => {
    expect(withRegion({ category: 'all' }, 'all')).toEqual({
      category: 'all',
    });
    expect(withRegion({ category: 'all' }, 'seoul')).toEqual({
      category: 'all',
      region: 'seoul',
    });
  });
});
