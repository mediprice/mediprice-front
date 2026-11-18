import { describe, expect, it } from 'vitest';

import {
  clampRadius,
  clampToKorea,
  defaultRadius,
  distanceBetween,
  hasMovedAway,
  isInKorea,
  regionCenter,
  roundLatLng,
  SEOUL_CITY_HALL,
} from './map-geo';

describe('clampToKorea', () => {
  it('범위 안의 좌표는 그대로 둔다', () => {
    expect(clampToKorea(SEOUL_CITY_HALL)).toEqual(SEOUL_CITY_HALL);
  });

  it('범위 밖 좌표는 가장 가까운 경계(위도 33~39, 경도 124~132)로 붙인다', () => {
    expect(clampToKorea({ lat: 40.2, lng: 123.1 })).toEqual({
      lat: 39,
      lng: 124,
    });
    expect(clampToKorea({ lat: 30, lng: 140 })).toEqual({ lat: 33, lng: 132 });
    expect(clampToKorea({ lat: 35.1, lng: 135 })).toEqual({
      lat: 35.1,
      lng: 132,
    });
  });

  it('경계 값은 범위 안으로 본다', () => {
    expect(isInKorea({ lat: 39, lng: 132 })).toBe(true);
    expect(isInKorea({ lat: 33, lng: 124 })).toBe(true);
    expect(isInKorea({ lat: 39.0001, lng: 127 })).toBe(false);
  });
});

describe('clampRadius', () => {
  it('백엔드가 받는 100m~10km로 자르고 정수로 맞춘다', () => {
    expect(clampRadius(50)).toBe(100);
    expect(clampRadius(25000)).toBe(10000);
    expect(clampRadius(1234.6)).toBe(1235);
  });
});

describe('defaultRadius', () => {
  it('항목을 고르면 3km, 아니면 병원이 많아 1km에서 시작한다', () => {
    expect(defaultRadius(true)).toBe(3000);
    expect(defaultRadius(false)).toBe(1000);
  });
});

describe('roundLatLng', () => {
  it('소수 다섯째 자리로 반올림한다', () => {
    expect(roundLatLng({ lat: 37.566535123, lng: 126.977969999 })).toEqual({
      lat: 37.56654,
      lng: 126.97797,
    });
  });
});

describe('distanceBetween · hasMovedAway', () => {
  it('서울시청과 강남역 사이는 약 8.8km다', () => {
    const gangnam = { lat: 37.4979, lng: 127.0276 };
    expect(distanceBetween(SEOUL_CITY_HALL, gangnam)).toBeGreaterThan(8500);
    expect(distanceBetween(SEOUL_CITY_HALL, gangnam)).toBeLessThan(9100);
  });

  it('반경의 1/4보다 멀리 옮겼을 때만 다시 찾기를 권한다', () => {
    const near = { lat: SEOUL_CITY_HALL.lat + 0.001, lng: SEOUL_CITY_HALL.lng };
    const far = { lat: SEOUL_CITY_HALL.lat + 0.01, lng: SEOUL_CITY_HALL.lng };
    expect(hasMovedAway(SEOUL_CITY_HALL, near, 1000)).toBe(false);
    expect(hasMovedAway(SEOUL_CITY_HALL, far, 1000)).toBe(true);
    expect(hasMovedAway(SEOUL_CITY_HALL, far, 10000)).toBe(false);
  });
});

describe('regionCenter', () => {
  it('경기만 경기도청이고 서울·서울경기·전국은 서울시청이다', () => {
    expect(regionCenter('metro')).toEqual(SEOUL_CITY_HALL);
    expect(regionCenter('seoul')).toEqual(SEOUL_CITY_HALL);
    expect(regionCenter('all')).toEqual(SEOUL_CITY_HALL);
    expect(regionCenter('gyeonggi')).not.toEqual(SEOUL_CITY_HALL);
    expect(isInKorea(regionCenter('gyeonggi'))).toBe(true);
  });
});
