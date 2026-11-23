import { describe, expect, it } from 'vitest';

import { areaScope } from './area-filters';
import type { TurnArea } from './schemas';

const area = (
  sidoCode: string,
  sgguCode: string | null,
  label: string,
  near?: { place: string; lat: number; lng: number },
): TurnArea => ({
  sidoCode,
  sgguCode,
  label,
  place: near?.place ?? null,
  lat: near?.lat ?? null,
  lng: near?.lng ?? null,
});

describe('areaScope', () => {
  it('장소가 없으면 기본 지역이다', () => {
    expect(areaScope(null)).toEqual({
      kind: 'default',
      filters: { region: 'metro', sort: 'price_asc' },
      near: null,
    });
  });

  it('장소가 없을 때 결과에서 고른 지역이 있으면 그 지역으로 본다', () => {
    expect(areaScope(null, 'gyeonggi')).toMatchObject({
      kind: 'default',
      filters: { region: 'gyeonggi' },
    });
  });

  it('장소를 말했으면 고른 지역보다 그 장소를 쓴다', () => {
    expect(areaScope(area('110000', null, '서울'), 'all')).toMatchObject({
      kind: 'area',
      filters: { region: 'seoul' },
    });
  });

  it('서울 시군구면 서울과 그 시군구로 좁힌다', () => {
    expect(areaScope(area('110000', '110015', '서울 은평구'))).toEqual({
      kind: 'area',
      filters: { region: 'seoul', sggu: '110015', sort: 'price_asc' },
      label: '서울 은평구',
      near: null,
    });
  });

  it('시도만 맞췄으면 시도로만 좁힌다', () => {
    expect(areaScope(area('310000', null, '경기'))).toEqual({
      kind: 'area',
      filters: { region: 'gyeonggi', sort: 'price_asc' },
      label: '경기',
      near: null,
    });
  });

  it('시군구가 다른 시도의 것이면 버린다', () => {
    expect(areaScope(area('110000', '310401', '서울')).filters).toEqual({
      region: 'seoul',
      sort: 'price_asc',
    });
  });

  it('서울·경기 밖이면 전국으로 보여 준다', () => {
    expect(areaScope(area('210000', '210004', '부산 해운대구'))).toEqual({
      kind: 'outside',
      filters: { region: 'all', sort: 'price_asc' },
      label: '부산 해운대구',
      near: null,
    });
  });

  it('좌표가 있으면 장소 이름과 중심을 함께 준다', () => {
    expect(
      areaScope(
        area('110000', '110015', '서울 은평구', {
          place: '응암역',
          lat: 37.59869,
          lng: 126.91484,
        }),
      ).near,
    ).toEqual({ place: '응암역', center: { lat: 37.59869, lng: 126.91484 } });
  });

  it('좌표가 하나라도 없으면 주변 병원을 찾지 않는다', () => {
    expect(
      areaScope({ ...area('110000', '110015', '서울 은평구'), lat: 37.5 }).near,
    ).toBeNull();
  });
});
