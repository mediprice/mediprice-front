'use client';

import { latLng, type Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

import type { LatLng } from '../map-geo';
import type { MapMarker } from './hospital-markers';

export type MapSearchArea = { center: LatLng; radius: number };

function isHidden(map: LeafletMap) {
  const container = map.getContainer();
  return container.clientWidth === 0 || container.clientHeight === 0;
}

export function boundsOf(search: MapSearchArea) {
  return latLng(search.center.lat, search.center.lng).toBounds(
    search.radius * 2,
  );
}

/**
 * 검색 영역이 바뀌면 원이 보이게 맞추고, 목록에서 고른 병원이 화면 밖이면 그쪽으로 옮긴다.
 * 모바일 지도/목록 전환으로 숨었다 보이면(크기 0 → 실제 크기) 크기를 다시 재고 검색 영역에 다시 맞춘다.
 */
export function MapViewSync({
  search,
  markers,
  selectedId,
  onMoveEnd,
  isReducedMotion,
}: {
  search: MapSearchArea;
  markers: MapMarker[];
  selectedId: string | null;
  onMoveEnd: (center: LatLng) => void;
  isReducedMotion: boolean;
}) {
  const map = useMap();
  const fittedSearch = useRef(search);
  const selectedPosition = useRef<LatLng | null>(null);

  useMapEvents({
    moveend: () => {
      if (isHidden(map)) return;
      const center = map.getCenter();
      onMoveEnd({ lat: center.lat, lng: center.lng });
    },
  });

  useEffect(() => {
    let wasHidden = isHidden(map);
    const observer = new ResizeObserver(() => {
      if (isHidden(map)) {
        wasHidden = true;
        return;
      }
      map.invalidateSize({ animate: false });
      if (wasHidden) {
        map.fitBounds(boundsOf(fittedSearch.current), { animate: false });
        if (selectedPosition.current) {
          map.panInside(selectedPosition.current, {
            padding: [48, 48],
            animate: false,
          });
        }
      }
      wasHidden = false;
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (search === fittedSearch.current) return;
    fittedSearch.current = search;
    if (isHidden(map)) return;
    map.fitBounds(boundsOf(search), { animate: !isReducedMotion });
  }, [search, map, isReducedMotion]);

  const selected = markers.find((marker) => marker.id === selectedId)?.position;
  const selectedLat = selected?.lat;
  const selectedLng = selected?.lng;
  useEffect(() => {
    selectedPosition.current =
      selectedLat === undefined || selectedLng === undefined
        ? null
        : { lat: selectedLat, lng: selectedLng };
    if (!selectedPosition.current || isHidden(map)) return;
    map.panInside(selectedPosition.current, {
      padding: [48, 48],
      animate: !isReducedMotion,
    });
  }, [selectedId, selectedLat, selectedLng, map, isReducedMotion]);

  return null;
}
