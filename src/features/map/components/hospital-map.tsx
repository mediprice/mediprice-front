'use client';

import 'leaflet/dist/leaflet.css';

import { latLngBounds, type Map as LeafletMap } from 'leaflet';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useState } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer } from 'react-leaflet';

import { KOREA_BOUNDS, type LatLng } from '../map-geo';
import { useReducedMotion } from '../use-reduced-motion';
import { HospitalMarkers, type MapMarker } from './hospital-markers';
import { boundsOf, type MapSearchArea, MapViewSync } from './map-view-sync';

export type HospitalMapProps = {
  /** 바뀌면 지도가 이 원이 보이게 맞춘다. 같은 객체를 다시 넘기면 움직이지 않는다. */
  search: MapSearchArea;
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 사용자가 지도를 옮기거나 확대한 뒤의 중심. */
  onMoveEnd: (center: LatLng) => void;
  userPosition?: LatLng | null;
  /** 오른쪽 아래 확대 버튼 위에 쌓을 조작(내 위치 등). */
  controls?: ReactNode;
};

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAX_BOUNDS = latLngBounds(
  [KOREA_BOUNDS.south - 0.5, KOREA_BOUNDS.west - 0.5],
  [KOREA_BOUNDS.north + 0.5, KOREA_BOUNDS.east + 0.5],
);

/**
 * 지도 라이브러리(Leaflet + OpenStreetMap)를 이 파일 안에만 둔다. 다른 지도(네이버 등)로 바꿀 때는 같은 props로
 * 이 컴포넌트만 다시 만든다. 지도는 보조 수단이고 모든 정보는 목록에서도 볼 수 있다.
 */
export function HospitalMap({
  search,
  markers,
  selectedId,
  onSelect,
  onMoveEnd,
  userPosition,
  controls,
}: HospitalMapProps) {
  const t = useTranslations('map.mapControls');
  const isReducedMotion = useReducedMotion();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [initialBounds] = useState(() => boundsOf(search));

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', t('label'));
  }, [map, t]);

  return (
    <div className="relative isolate size-full">
      <MapContainer
        ref={setMap}
        bounds={initialBounds}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={0.8}
        minZoom={7}
        zoomSnap={0.5}
        maxZoom={19}
        zoomControl={false}
        zoomAnimation={!isReducedMotion}
        fadeAnimation={!isReducedMotion}
        markerZoomAnimation={!isReducedMotion}
        className="isolate size-full bg-surface-strong font-sans"
      >
        <TileLayer
          url={TILE_URL}
          maxZoom={19}
          attribution={`&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">${t('osmContributors')}</a>`}
        />
        <Circle
          center={[search.center.lat, search.center.lng]}
          radius={search.radius}
          interactive={false}
          pathOptions={{
            weight: 1.5,
            dashArray: '6 6',
            className: 'fill-primary/8 stroke-primary/60',
          }}
        />
        {userPosition && (
          <CircleMarker
            center={[userPosition.lat, userPosition.lng]}
            radius={7}
            interactive={false}
            pathOptions={{
              weight: 3,
              fillOpacity: 1,
              className: 'fill-primary stroke-bg',
            }}
          />
        )}
        <HospitalMarkers
          markers={markers}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        <MapViewSync
          search={search}
          markers={markers}
          selectedId={selectedId}
          onMoveEnd={onMoveEnd}
          isReducedMotion={isReducedMotion}
        />
      </MapContainer>
      <div className="absolute right-3 bottom-8 flex flex-col items-end gap-3">
        {controls}
        <div className="flex flex-col overflow-hidden rounded-lg bg-bg shadow-card">
          <button
            type="button"
            aria-label={t('zoomIn')}
            onClick={() => map?.zoomIn(1, { animate: !isReducedMotion })}
            className="flex size-11 items-center justify-center text-text-primary hover:bg-surface active:bg-surface-strong"
          >
            <Plus aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
          <span aria-hidden="true" className="h-px bg-hairline" />
          <button
            type="button"
            aria-label={t('zoomOut')}
            onClick={() => map?.zoomOut(1, { animate: !isReducedMotion })}
            className="flex size-11 items-center justify-center text-text-primary hover:bg-surface active:bg-surface-strong"
          >
            <Minus aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
