'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import type { MapMarker } from '@/features/map/components/marker-icon';
import { withExactDistances } from '@/features/map/exact-distance';
import { mapQueries, type NearbyHospital } from '@/features/map/queries';
import { comparableBand } from '@/features/npay/average-verdict';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';

import type { MapSearch } from './use-map-search';

const PLACEHOLDER_SEARCH = { lat: 0, lng: 0, radius: 0 };

/**
 * 주변 병원(페이지를 이어 붙여 중복 제거, 정확한 중심에서 잰 가까운 순)과 지도 마커. 항목이 있으면 마커에 병원별 최저가를 쓴다.
 * 최저가는 서울·경기 평균과 견줄 수 있는 범위(평균의 1/3~3배) 안에서만 매긴다. 1일당·5분 같은 다른 구성의 가격이 최저가로 뜨지 않게
 * 평균(목록의 꼬리표와 같은 요약)을 받은 뒤 찾고, 요약이 실패하면 범위 없이 찾는다.
 */
export function useNearbyResults(
  search: MapSearch | null,
  item: string | null,
) {
  const tPrice = useTranslations('common.price');
  const regionSummary = useQuery({
    ...npayQueries.summaryIn(item ?? '', sidoCodesOf(DEFAULT_REGION)),
    enabled: item !== null,
  });
  const query = useInfiniteQuery({
    ...mapQueries.nearby({
      ...(search
        ? { ...search.center, radius: search.radius }
        : PLACEHOLDER_SEARCH),
      ...(item && {
        npayCode: item,
        band: comparableBand(regionSummary.data?.avgPrice),
      }),
    }),
    enabled: search !== null && (item === null || !regionSummary.isPending),
  });

  const hospitals = useMemo(() => {
    const seen = new Set<string>();
    const list: NearbyHospital[] = [];
    for (const hospital of query.data?.pages.flatMap((page) => page.content) ??
      []) {
      if (seen.has(hospital.ykiho)) continue;
      seen.add(hospital.ykiho);
      list.push(hospital);
    }
    return search ? withExactDistances(list, search.center) : list;
  }, [query.data, search]);

  const markers = useMemo<MapMarker[]>(
    () =>
      hospitals.flatMap((hospital) => {
        if (hospital.latitude === null || hospital.longitude === null) {
          return [];
        }
        const kind = !item
          ? 'plain'
          : hospital.minPrice === null
            ? 'noPrice'
            : 'price';
        const label =
          kind === 'plain'
            ? hospital.name
            : hospital.minPrice === null
              ? tPrice('none')
              : tPrice('won', { amount: hospital.minPrice });
        return [
          {
            id: hospital.ykiho,
            position: { lat: hospital.latitude, lng: hospital.longitude },
            kind,
            label,
          },
        ];
      }),
    [hospitals, item, tPrice],
  );

  return { query, hospitals, markers };
}
