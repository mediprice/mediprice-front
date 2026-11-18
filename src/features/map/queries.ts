import { infiniteQueryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { ANONYMOUS_REQUEST_HEADER } from '@/lib/api/paths';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

import { clampRadius, clampToKorea, coarsenLatLng } from './map-geo';

export type NearbyHospital = components['schemas']['NearbyHospitalResponse'];
export type NearbyCondition = components['schemas']['NearbyCondition'];
export type NearbySearch = {
  lat: number;
  lng: number;
  radius: number;
  npayCode?: string;
};

/** 지도에 한꺼번에 올려도 느려지지 않는 크기. 더 보려면 목록에서 다음 페이지를 받는다. */
const NEARBY_PAGE_SIZE = 50;

/** 지도 중심이 한국 밖이어도 400이 나지 않게 범위 안으로 붙이고, 약 1km 격자로 흐린 좌표만 보낸다(coarsenLatLng). */
export function toNearbyCondition(search: NearbySearch): NearbyCondition {
  const center = coarsenLatLng(clampToKorea(search));
  return {
    lat: center.lat,
    lng: center.lng,
    radius: clampRadius(search.radius),
    ...(search.npayCode && { npayCode: search.npayCode }),
  };
}

export const mapKeys = {
  all: ['map'] as const,
  nearby: (condition: NearbyCondition) =>
    [...mapKeys.all, 'nearby', condition] as const,
};

export const mapQueries = {
  /** 가까운 순. 항목 코드를 주면 그 항목 가격이 있는 병원만, 병원별 최저가(minPrice)와 함께 온다. 흐린 위치가 계정과 묶이지 않게 로그인 없이 보낸다. */
  nearby: (search: NearbySearch) => {
    const condition = toNearbyCondition(search);
    return infiniteQueryOptions({
      queryKey: mapKeys.nearby(condition),
      queryFn: ({ pageParam }) =>
        unwrap(
          apiClient.GET('/api/hospitals/nearby', {
            headers: { [ANONYMOUS_REQUEST_HEADER]: '1' },
            params: {
              query: {
                condition,
                pageQuery: { page: pageParam, size: NEARBY_PAGE_SIZE },
              },
            },
          }),
        ),
      initialPageParam: 0,
      getNextPageParam: (last) =>
        last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    });
  },
};
