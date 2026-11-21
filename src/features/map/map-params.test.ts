import { describe, expect, it } from 'vitest';

import { buildMapQuery, mapHrefForItem, parseMapParams } from './map-params';

describe('parseMapParams', () => {
  it('아무것도 없으면 항목·중심 없이 서울·경기와 1km로 시작한다', () => {
    expect(parseMapParams({})).toEqual({
      item: null,
      region: 'metro',
      center: null,
      radius: 1000,
      back: null,
    });
  });

  it('항목이 있으면 기본 반경은 3km다', () => {
    expect(parseMapParams({ item: 'MX1220000' })).toMatchObject({
      item: 'MX1220000',
      radius: 3000,
    });
  });

  it('공유한 좌표·반경·지역을 읽는다', () => {
    expect(
      parseMapParams({
        item: 'MX1220000',
        region: 'gyeonggi',
        lat: '37.4979',
        lng: '127.0276',
        radius: '5000',
      }),
    ).toEqual({
      item: 'MX1220000',
      region: 'gyeonggi',
      center: { lat: 37.4979, lng: 127.0276 },
      radius: 5000,
      back: null,
    });
  });

  it('항목 화면 필터(back)는 검증해 다시 만들고, 항목이 없으면 버린다', () => {
    expect(
      parseMapParams({
        item: 'MX1220000',
        back: 'region=seoul&sggu=110023&sort=price_desc&evil=<x>',
      }).back,
    ).toBe('region=seoul&sggu=110023&sort=price_desc');
    expect(
      parseMapParams({ item: 'MX1220000', back: 'sort=price_asc' }).back,
    ).toBeNull();
    expect(parseMapParams({ back: 'region=seoul' }).back).toBeNull();
  });

  it('범위 밖 좌표와 한쪽만 있는 좌표는 버린다', () => {
    expect(parseMapParams({ lat: '40.5', lng: '127' }).center).toBeNull();
    expect(parseMapParams({ lat: '37.5' }).center).toBeNull();
    expect(parseMapParams({ lat: 'abc', lng: '127' }).center).toBeNull();
  });

  it('선택지에 없는 반경과 잘못된 항목 코드·지역은 기본값으로 돌린다', () => {
    expect(
      parseMapParams({ radius: '2000', item: '<script>', region: 'busan' }),
    ).toMatchObject({ radius: 1000, item: null, region: 'metro' });
  });

  it('같은 파라미터가 여러 번 오면 첫 값을 쓴다', () => {
    expect(
      parseMapParams({ item: ['MX1220000', 'X'], radius: ['10000', '1000'] }),
    ).toMatchObject({ item: 'MX1220000', radius: 10000 });
  });
});

describe('buildMapQuery', () => {
  it('기본값(서울·경기, 기본 반경)은 빼고 좌표는 다섯째 자리로 줄인다', () => {
    expect(
      buildMapQuery({
        item: 'MX1220000',
        region: 'metro',
        center: { lat: 37.566535123, lng: 126.977969999 },
        radius: 3000,
      }),
    ).toBe('item=MX1220000&lat=37.56654&lng=126.97797');
  });

  it('중심이 없으면 좌표를 넣지 않는다', () => {
    expect(
      buildMapQuery({
        item: null,
        region: 'seoul',
        center: null,
        radius: 5000,
      }),
    ).toBe('region=seoul&radius=5000');
  });

  it('만든 쿼리를 다시 읽으면 같은 값이다', () => {
    const params = {
      item: 'MX1220000',
      region: 'gyeonggi' as const,
      center: { lat: 37.2893, lng: 127.0535 },
      radius: 10000 as const,
      back: 'region=gyeonggi&sort=price_desc',
    };
    const search = Object.fromEntries(
      new URLSearchParams(buildMapQuery(params)),
    );
    expect(parseMapParams(search)).toEqual(params);
  });
});

describe('mapHrefForItem', () => {
  it('지역은 쿼리로, 나머지 필터는 back으로 넘긴다', () => {
    const href = mapHrefForItem('MX1220000', {
      region: 'seoul',
      sggu: '110023',
      sort: 'price_desc',
    });
    const search = new URL(href, 'http://x').searchParams;
    expect(search.get('item')).toBe('MX1220000');
    expect(search.get('region')).toBe('seoul');
    expect(search.get('back')).toBe('region=seoul&sggu=110023&sort=price_desc');
  });

  it('기본 필터면 back을 붙이지 않는다', () => {
    expect(
      mapHrefForItem('MX1220000', { region: 'metro', sort: 'price_asc' }),
    ).toBe('/map?item=MX1220000');
  });
});
