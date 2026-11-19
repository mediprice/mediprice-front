import { describe, expect, it } from 'vitest';

import { areaScope } from './area-filters';

describe('areaScope', () => {
  it('장소가 없으면 기본 지역이다', () => {
    expect(areaScope(null)).toEqual({
      kind: 'default',
      filters: { region: 'metro', sort: 'price_asc' },
    });
  });

  it('서울 시군구면 서울과 그 시군구로 좁힌다', () => {
    expect(
      areaScope({
        sidoCode: '110000',
        sgguCode: '110015',
        label: '서울 은평구',
      }),
    ).toEqual({
      kind: 'area',
      filters: { region: 'seoul', sggu: '110015', sort: 'price_asc' },
      label: '서울 은평구',
    });
  });

  it('시도만 맞췄으면 시도로만 좁힌다', () => {
    expect(
      areaScope({ sidoCode: '310000', sgguCode: null, label: '경기' }),
    ).toEqual({
      kind: 'area',
      filters: { region: 'gyeonggi', sort: 'price_asc' },
      label: '경기',
    });
  });

  it('시군구가 다른 시도의 것이면 버린다', () => {
    expect(
      areaScope({ sidoCode: '110000', sgguCode: '310401', label: '서울' })
        .filters,
    ).toEqual({ region: 'seoul', sort: 'price_asc' });
  });

  it('서울·경기 밖이면 전국으로 보여 준다', () => {
    expect(
      areaScope({
        sidoCode: '210000',
        sgguCode: '210004',
        label: '부산 해운대구',
      }),
    ).toEqual({
      kind: 'outside',
      filters: { region: 'all', sort: 'price_asc' },
      label: '부산 해운대구',
    });
  });
});
