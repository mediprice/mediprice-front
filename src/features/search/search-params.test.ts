import { describe, expect, it } from 'vitest';

import { parseSearchParams } from './search-params';

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
      region: 'metro',
    });
  });

  it('지역이 없거나 잘못되면 서울·경기(metro)이고, 전국(all)도 받는다', () => {
    expect(parseSearchParams({ q: '라식' }).region).toBe('metro');
    expect(parseSearchParams({ q: '라식', region: 'busan' }).region).toBe(
      'metro',
    );
    expect(parseSearchParams({ q: '라식', region: 'all' }).region).toBe('all');
  });

  it('검색어가 없고 분류가 있으면 분류 탐색이다', () => {
    expect(parseSearchParams({ category: 'physio', code: '1070Z050' })).toEqual(
      {
        mode: 'category',
        category: 'physio',
        code: '1070Z050',
        region: 'metro',
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
      region: 'metro',
    });
  });

  it('잘못된 값은 기본값으로 바꾸고, 여러 번 온 값은 첫 값을 쓴다', () => {
    expect(
      parseSearchParams({
        type: 'doctor',
        q: ['라식', '라섹'],
        region: ['gyeonggi', 'seoul'],
      }),
    ).toEqual({ mode: 'item', keyword: '라식', region: 'gyeonggi' });
    expect(
      parseSearchParams({ category: '<script>', code: 'drop table' }),
    ).toEqual({ mode: 'prompt', type: 'item', region: 'metro' });
  });

  it('검색어는 100자까지만 쓴다', () => {
    const state = parseSearchParams({ q: '가'.repeat(150) });
    expect(state.mode === 'item' && state.keyword.length).toBe(100);
  });
});
