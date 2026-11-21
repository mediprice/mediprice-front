'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { LazyHospitalMap } from '@/features/map/components/lazy-hospital-map';
import type { MapMarker } from '@/features/map/components/marker-icon';
import type { LatLng } from '@/features/map/map-geo';
import { mapQueries } from '@/features/map/queries';
import type { PriceBand } from '@/features/npay/average-verdict';

import { DirectionsButton } from './directions-button';

/** 병원이 가운데에 오고, 가까운 이웃 몇 곳이 함께 보이는 폭(최소·최대). */
const MIN_VIEW_RADIUS = 400;
const MAX_VIEW_RADIUS = 1000;
const NEIGHBORS_IN_VIEW = 4;
/** 같은 항목 가격이 있는 이웃을 찾는 반경과 수. 지도에 점으로만 올린다. */
const NEIGHBOR_RADIUS = 1000;
const NEIGHBOR_COUNT = 30;

/**
 * 병원 상세의 지도. 이 병원은 이름 핀으로 늘 보이고, 항목을 골라 왔으면 같은 항목 가격(평균과 견줄 수 있는 범위)이 있는
 * 주변 병원을 점으로 함께 보여 준다. 점을 누르면 그 병원 상세로 같은 항목을 들고 옮긴다. 지도는 위치를 보여 주는 보조 수단이고
 * 모든 정보는 옆(모바일은 아래) 패널에 있다.
 */
export function HospitalAreaMap({
  ykiho,
  name,
  position,
  itemCode,
  band,
  directionsQuery,
}: {
  ykiho: string;
  name: string;
  position: LatLng;
  /** 길찾기가 앱을 못 열 때 웹 지도에서 찾을 검색어(주소 또는 이름). */
  directionsQuery: string;
  itemCode: string | null;
  band: PriceBand | null;
}) {
  const router = useRouter();
  const tPrice = useTranslations('common.price');
  const neighbors = useInfiniteQuery({
    ...mapQueries.nearby({
      ...position,
      radius: NEIGHBOR_RADIUS,
      npayCode: itemCode ?? undefined,
      band,
      size: NEIGHBOR_COUNT,
    }),
    enabled: itemCode !== null,
  });
  const neighborList = neighbors.data?.pages[0]?.content;
  const search = useMemo(() => {
    const distances = (neighborList ?? [])
      .filter((hospital) => hospital.ykiho !== ykiho)
      .map((hospital) => hospital.distanceMeters);
    const reach = distances[Math.min(NEIGHBORS_IN_VIEW, distances.length) - 1];
    return {
      center: position,
      radius: Math.min(
        MAX_VIEW_RADIUS,
        Math.max(MIN_VIEW_RADIUS, (reach ?? 0) * 1.15),
      ),
    };
  }, [neighborList, position, ykiho]);
  const markers = useMemo<MapMarker[]>(() => {
    const others = (neighborList ?? []).flatMap((hospital) =>
      hospital.ykiho === ykiho ||
      hospital.latitude === null ||
      hospital.longitude === null
        ? []
        : [
            {
              id: hospital.ykiho,
              position: { lat: hospital.latitude, lng: hospital.longitude },
              kind: 'plain' as const,
              label:
                hospital.minPrice == null
                  ? hospital.name
                  : `${hospital.name} · ${tPrice('won', { amount: hospital.minPrice })}`,
            },
          ],
    );
    return [{ id: ykiho, position, kind: 'plain', label: name }, ...others];
  }, [neighborList, ykiho, position, name, tPrice]);

  return (
    <LazyHospitalMap
      search={search}
      markers={markers}
      selectedId={ykiho}
      onSelect={(id) => {
        if (id === ykiho || !itemCode) return;
        router.push(
          `/hospitals/${encodeURIComponent(id)}?${new URLSearchParams({ item: itemCode }).toString()}`,
        );
      }}
      onMoveEnd={() => {}}
      showArea={false}
      controls={
        <DirectionsButton
          name={name}
          query={directionsQuery}
          position={position}
          className="rounded-full shadow-float"
        />
      }
    />
  );
}
