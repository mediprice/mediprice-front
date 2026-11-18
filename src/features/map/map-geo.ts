import type { ServiceRegion } from '@/features/regions/service-region';

export type LatLng = { lat: number; lng: number };

/** 주변 병원 API가 받는 범위다. 밖이면 400이다. */
export const KOREA_BOUNDS = {
  south: 33,
  north: 39,
  west: 124,
  east: 132,
} as const;

export const SEOUL_CITY_HALL: LatLng = { lat: 37.5665, lng: 126.978 };
const GYEONGGI_PROVINCIAL_OFFICE: LatLng = { lat: 37.2893, lng: 127.0535 };

/** 반경 선택지(m). 백엔드는 100m~10km만 받는다. */
export const RADIUS_OPTIONS = [1000, 3000, 5000, 10000] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];
const MIN_RADIUS = 100;
const MAX_RADIUS = 10000;

export function defaultRadius(hasItem: boolean): RadiusOption {
  return hasItem ? 3000 : 1000;
}

export function isInKorea({ lat, lng }: LatLng) {
  return (
    lat >= KOREA_BOUNDS.south &&
    lat <= KOREA_BOUNDS.north &&
    lng >= KOREA_BOUNDS.west &&
    lng <= KOREA_BOUNDS.east
  );
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** 지도 중심이 범위 밖으로 나가도 API가 400을 내지 않게 가장 가까운 경계로 붙인다. */
export function clampToKorea({ lat, lng }: LatLng): LatLng {
  return {
    lat: clamp(lat, KOREA_BOUNDS.south, KOREA_BOUNDS.north),
    lng: clamp(lng, KOREA_BOUNDS.west, KOREA_BOUNDS.east),
  };
}

export function clampRadius(meters: number) {
  return Math.round(clamp(meters, MIN_RADIUS, MAX_RADIUS));
}

/** 소수 다섯째 자리(약 1m)로 맞춰 쿼리 키와 URL이 미세한 이동마다 바뀌지 않게 한다. */
export function roundLatLng({ lat, lng }: LatLng): LatLng {
  const round = (value: number) => Math.round(value * 1e5) / 1e5;
  return { lat: round(lat), lng: round(lng) };
}

/** 위치를 쓸 수 없을 때 보여 줄 지역 중심. 서울·경기와 전국은 서울시청이다. */
export function regionCenter(region: ServiceRegion): LatLng {
  return region === 'gyeonggi' ? GYEONGGI_PROVINCIAL_OFFICE : SEOUL_CITY_HALL;
}

const EARTH_RADIUS = 6371000;
const toRadians = (degree: number) => (degree * Math.PI) / 180;

/** 두 지점 사이의 직선 거리(m, 하버사인). */
export function distanceBetween(a: LatLng, b: LatLng) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

/** 반경의 1/4 넘게 옮기면 결과가 달라질 만하다고 보고 "이 지역에서 다시 찾기"를 띄운다. */
export function hasMovedAway(from: LatLng, to: LatLng, radius: number) {
  return distanceBetween(from, to) > radius / 4;
}
