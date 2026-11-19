import { distanceBetween, type LatLng } from './map-geo';

type Located = {
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number;
};

/**
 * 서버는 약 1km로 흐린 중심에서 거리를 재므로, 브라우저에만 있는 정확한 중심에서 다시 재고 가까운 순으로 다시 놓는다.
 * 위치가 없는 병원은 서버 값을 그대로 둔다.
 */
export function withExactDistances<T extends Located>(
  hospitals: readonly T[],
  center: LatLng,
): T[] {
  return hospitals
    .map((hospital) =>
      hospital.latitude === null || hospital.longitude === null
        ? hospital
        : {
            ...hospital,
            distanceMeters: Math.round(
              distanceBetween(center, {
                lat: hospital.latitude,
                lng: hospital.longitude,
              }),
            ),
          },
    )
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
