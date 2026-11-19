'use client';

import { useMemo } from 'react';

import { LazyHospitalMap } from '@/features/map/components/lazy-hospital-map';
import type { MapMarker } from '@/features/map/components/marker-icon';

/** 병원 한 곳의 위치. 고른 상태의 이름 핀 하나만 두고, 주변이 조금 보이게 반경 400m를 맞춘다. */
const VIEW_RADIUS = 400;

export function HospitalLocationMap({
  id,
  name,
  position,
}: {
  id: string;
  name: string;
  position: { lat: number; lng: number };
}) {
  const search = useMemo(
    () => ({ center: position, radius: VIEW_RADIUS }),
    [position],
  );
  const markers = useMemo<MapMarker[]>(
    () => [{ id, position, kind: 'plain', label: name }],
    [id, name, position],
  );
  return (
    <div className="h-56 overflow-hidden rounded-xl border border-hairline md:h-72">
      <LazyHospitalMap
        search={search}
        markers={markers}
        selectedId={id}
        onSelect={() => {}}
        onMoveEnd={() => {}}
        showArea={false}
      />
    </div>
  );
}
