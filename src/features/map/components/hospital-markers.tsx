'use client';

import { useMemo, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';

import type { LatLng } from '../map-geo';
import { findCollapsedLabels } from '../marker-layout';
import {
  createMarkerIcon,
  type MapMarkerKind,
  type MarkerDisplay,
} from './marker-icon';

export type MapMarker = {
  id: string;
  position: LatLng;
  kind: MapMarkerKind;
  /** 마커에 보일 짧은 문구(가격, 또는 고른 병원의 이름). 번역한 문자열을 넘긴다. */
  label: string;
};

const Z_SELECTED = 1000;
const Z_HOVER = 900;
const Z_LABEL = 100;

/** 확대 수준마다 겹치는 가격 알약을 점으로 줄인다. 고른 병원과 마우스를 올린 점은 늘 글자로 보인다. */
export function HospitalMarkers({
  markers,
  selectedId,
  onSelect,
}: {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const collapsed = useMemo(() => {
    const candidates = markers
      .filter((marker) => marker.kind !== 'plain')
      .map((marker) => {
        const point = map.project(
          [marker.position.lat, marker.position.lng],
          zoom,
        );
        return { id: marker.id, x: point.x, y: point.y, label: marker.label };
      });
    return findCollapsedLabels(candidates, selectedId ? [selectedId] : []);
  }, [markers, selectedId, zoom, map]);

  return markers.map((marker) => {
    const display: MarkerDisplay =
      marker.id === selectedId
        ? 'selected'
        : marker.id === hoveredId
          ? 'hover'
          : collapsed.has(marker.id)
            ? 'dot'
            : 'label';
    return (
      <HospitalMarker
        key={marker.id}
        marker={marker}
        display={display}
        onSelect={onSelect}
        onHover={setHoveredId}
      />
    );
  });
}

function HospitalMarker({
  marker,
  display,
  onSelect,
  onHover,
}: {
  marker: MapMarker;
  display: MarkerDisplay;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const { kind, label, id } = marker;
  const icon = useMemo(
    () => createMarkerIcon({ kind, label, display }),
    [kind, label, display],
  );
  const eventHandlers = useMemo(
    () => ({
      click: () => onSelect(id),
      mouseover: () => onHover(id),
      mouseout: () => onHover(null),
    }),
    [onSelect, onHover, id],
  );
  const zIndexOffset =
    display === 'selected'
      ? Z_SELECTED
      : display === 'hover'
        ? Z_HOVER
        : display === 'label'
          ? Z_LABEL
          : 0;
  return (
    <Marker
      position={[marker.position.lat, marker.position.lng]}
      icon={icon}
      keyboard={false}
      zIndexOffset={zIndexOffset}
      eventHandlers={eventHandlers}
    />
  );
}
