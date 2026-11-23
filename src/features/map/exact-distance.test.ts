import { describe, expect, it } from 'vitest';

import { withExactDistances } from './exact-distance';
import { coarsenLatLng, SEOUL_CITY_HALL } from './map-geo';

const hospital = (
  ykiho: string,
  latitude: number | null,
  longitude: number | null,
  distanceMeters: number,
) => ({ ykiho, latitude, longitude, distanceMeters });

describe('coarsenLatLng', () => {
  it('소수 둘째 자리로 반올림해 약 1km 격자로 흐린다', () => {
    expect(coarsenLatLng({ lat: 37.566535, lng: 126.977969 })).toEqual({
      lat: 37.57,
      lng: 126.98,
    });
  });

  it('흐린 좌표는 원래 좌표에서 1km 안쪽이다', () => {
    const exact = { lat: 37.565, lng: 126.985 };
    const coarse = coarsenLatLng(exact);

    expect(coarse).not.toEqual(exact);
    expect(
      withExactDistances([hospital('X', coarse.lat, coarse.lng, 0)], exact)[0]
        ?.distanceMeters,
    ).toBeLessThan(1000);
  });
});

describe('withExactDistances', () => {
  it('정확한 중심에서 거리를 다시 재고 가까운 순으로 놓는다', () => {
    const far = hospital('far', 37.5765, 126.978, 300);
    const near = hospital('near', 37.5675, 126.978, 900);

    const result = withExactDistances([far, near], SEOUL_CITY_HALL);

    expect(result.map((h) => h.ykiho)).toEqual(['near', 'far']);
    expect(result[0]?.distanceMeters).toBeGreaterThan(100);
    expect(result[0]?.distanceMeters).toBeLessThan(120);
  });

  it('위치가 없는 병원은 서버 거리를 그대로 둔다', () => {
    const unknown = hospital('unknown', null, null, 450);

    expect(withExactDistances([unknown], SEOUL_CITY_HALL)).toEqual([unknown]);
  });

  it('원래 배열을 바꾸지 않는다', () => {
    const list = [
      hospital('a', 37.58, 126.978, 1),
      hospital('b', 37.57, 126.978, 2),
    ];

    withExactDistances(list, SEOUL_CITY_HALL);

    expect(list.map((h) => h.distanceMeters)).toEqual([1, 2]);
  });
});
