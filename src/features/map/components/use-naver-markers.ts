'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import { findCollapsedLabels } from '@/features/map/marker-layout';
import { runCleanup } from '@/features/map/naver-sdk';
import type { NaverListener, NaverMarker } from '@/features/map/naver-types';

import {
  createMarkerContent,
  type MapMarker,
  type MarkerDisplay,
} from './marker-icon';
import type { NaverHandle } from './use-naver-map';

const Z_INDEX: Record<MarkerDisplay, number> = {
  selected: 1000,
  hover: 900,
  label: 100,
  dot: 0,
};

type Entry = { marker: NaverMarker; listeners: NaverListener[]; key: string };

/** 확대 수준마다 겹치는 가격 알약을 점으로 줄인다. 고른 병원과 마우스를 올린 점은 늘 글자로 보인다. */
export function useNaverMarkers(
  handle: NaverHandle | null,
  markers: MapMarker[],
  selectedId: string | null,
  onSelect: (id: string) => void,
) {
  /** 화면 좌표는 확대 수준마다 달라서, 바뀔 때마다 겹침을 다시 계산하는 신호로 쓴다. */
  const [zoom, setZoom] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const entries = useRef(new Map<string, Entry>());
  const select = useEffectEvent((id: string) => onSelect(id));

  useEffect(() => {
    if (!handle) return;
    const { api, map } = handle;
    const update = () => setZoom(map.getZoom());
    const listeners = [
      api.Event.addListener(map, 'zoom_changed', update),
      api.Event.addListener(map, 'idle', update),
    ];
    return () => runCleanup(() => api.Event.removeListener(listeners));
  }, [handle]);

  const collapsed = useMemo(() => {
    if (!handle) return new Set<string>();
    const { api, map } = handle;
    const projection = map.getProjection();
    const candidates = markers
      .filter((marker) => marker.kind !== 'plain' && marker.kind !== 'place')
      .map((marker) => {
        const point = projection.fromCoordToOffset(
          new api.LatLng(marker.position.lat, marker.position.lng),
        );
        return { id: marker.id, x: point.x, y: point.y, label: marker.label };
      });
    return findCollapsedLabels(candidates, selectedId ? [selectedId] : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zoom은 값이 아니라 다시 계산하라는 신호다.
  }, [handle, markers, selectedId, zoom]);

  useEffect(() => {
    if (!handle) return;
    const { api, map } = handle;
    const current = entries.current;
    const ids = new Set(markers.map((marker) => marker.id));
    for (const [id, entry] of current) {
      if (ids.has(id)) continue;
      runCleanup(() => {
        api.Event.removeListener(entry.listeners);
        entry.marker.setMap(null);
      });
      current.delete(id);
    }
    for (const marker of markers) {
      const display: MarkerDisplay =
        marker.id === selectedId
          ? 'selected'
          : marker.id === hoveredId
            ? 'hover'
            : collapsed.has(marker.id)
              ? 'dot'
              : 'label';
      const key = `${marker.kind}|${marker.label}|${marker.badge ?? ''}|${display}`;
      const existing = current.get(marker.id);
      if (existing?.key === key) continue;
      const icon = {
        content: createMarkerContent({ ...marker, display }),
        anchor: new api.Point(0, 0),
      };
      if (existing) {
        existing.marker.setIcon(icon);
        existing.marker.setZIndex(Z_INDEX[display]);
        existing.key = key;
        continue;
      }
      const created = new api.Marker({
        map,
        position: new api.LatLng(marker.position.lat, marker.position.lng),
        icon,
        zIndex: Z_INDEX[display],
      });
      const { id } = marker;
      current.set(id, {
        marker: created,
        key,
        listeners: [
          api.Event.addListener(created, 'click', () => select(id)),
          api.Event.addListener(created, 'mouseover', () => setHoveredId(id)),
          api.Event.addListener(created, 'mouseout', () =>
            setHoveredId((value) => (value === id ? null : value)),
          ),
        ],
      });
    }
  }, [handle, markers, selectedId, hoveredId, collapsed]);

  useEffect(() => {
    if (!handle) return;
    const current = entries.current;
    return () => {
      for (const entry of current.values()) {
        runCleanup(() => {
          handle.api.Event.removeListener(entry.listeners);
          entry.marker.setMap(null);
        });
      }
      current.clear();
    };
  }, [handle]);
}
