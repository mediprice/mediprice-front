import {
  infiniteQueryOptions,
  mutationOptions,
  type QueryClient,
} from '@tanstack/react-query';

import { consentKeys } from '@/features/auth/queries';
import type { PriceBand } from '@/features/npay/average-verdict';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { ANONYMOUS_REQUEST_HEADER } from '@/lib/api/paths';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

import { locationUsageApi } from './location-usage-api';
import { clampRadius, clampToKorea, coarsenLatLng } from './map-geo';

export type NearbyHospital = components['schemas']['NearbyHospitalResponse'];
export type NearbyCondition = components['schemas']['NearbyCondition'] &
  Partial<PriceBand>;
export type NearbySearch = {
  lat: number;
  lng: number;
  radius: number;
  npayCode?: string;
  /** 항목 코드와 함께 주면 이 범위의 가격만으로 병원별 최저가를 매기고, 범위 안 가격이 없는 병원은 뺀다. */
  band?: PriceBand | null;
  /** 한 번에 받을 병원 수. 기본은 지도에 올리는 50곳이다. */
  size?: number;
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
    ...(search.npayCode && { npayCode: search.npayCode, ...search.band }),
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
    const size = search.size ?? NEARBY_PAGE_SIZE;
    return infiniteQueryOptions({
      queryKey: [...mapKeys.nearby(condition), size] as const,
      queryFn: ({ pageParam }) =>
        unwrap(
          apiClient.GET('/api/hospitals/nearby', {
            headers: { [ANONYMOUS_REQUEST_HEADER]: '1' },
            params: {
              query: {
                condition,
                pageQuery: { page: pageParam, size },
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

export const locationUsageMutations = {
  /** 현재 위치로 주변 병원을 찾았다는 사실을 기록한다. 다른 탭·기기에서 철회해 동의가 없다고 하면(403) 동의 현황을 다시 받는다. */
  record: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: () => locationUsageApi.record(),
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.code === 'LOCATION_CONSENT_REQUIRED'
        ) {
          void queryClient.invalidateQueries({
            queryKey: consentKeys.status(),
          });
        }
      },
    }),
};
