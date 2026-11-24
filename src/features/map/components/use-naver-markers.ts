'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import {
  findCollapsedLabels,
  groupByPosition,
  nextMemberId,
  representativeOf,
} from '@/features/map/marker-layout';
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

/**
 * 같은 자리의 병원은 마커 하나로 묶고(대표 병원 문구 + 나머지 수), 누를 때마다 그 자리의 병원을 차례로 고른다.
 * 확대 수준마다 겹치는 가격 알약을 점으로 줄인다. 고른 병원과 마우스를 올린 점은 늘 글자로 보인다.
 */
export function useNaverMarkers(
  handle: NaverHandle | null,
  markers: MapMarker[],
  selectedId: string | null,
  onSelect: (id: string) => void,
) {
  const t = useTranslations('map.mapControls');
  /** 화면 좌표는 확대 수준마다 달라서, 바뀔 때마다 겹침을 다시 계산하는 신호로 쓴다. */
  const [zoom, setZoom] = useState<number | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const entries = useRef(new Map<string, Entry>());
  /** 고른 병원이 바뀌지 않는 지도(병원 상세)에서도 차례로 넘기도록 마지막으로 누른 병원을 기억한다. */
  const picked = useRef<string | null>(null);

  const groups = useMemo(
    () =>
      groupByPosition(markers).map((group) => {
        const shown = representativeOf(group, selectedId);
        const others = group.members.length - 1;
        return {
          key: group.key,
          members: group.members,
          position: shown.position,
          kind: shown.kind,
          badge: shown.badge,
          label:
            others > 0
              ? t('groupLabel', { label: shown.label, count: others })
              : shown.label,
          isSelected: shown.id === selectedId,
        };
      }),
    [markers, selectedId, t],
  );

  useEffect(() => {
    if (selectedId !== picked.current) picked.current = null;
  }, [selectedId]);

  const select = useEffectEvent((key: string) => {
    const group = groups.find((candidate) => candidate.key === key);
    if (!group) return;
    const current = group.members.some((member) => member.id === picked.current)
      ? picked.current
      : selectedId;
    const id = nextMemberId(group.members, current);
    picked.current = id;
    onSelect(id);
  });

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
    const candidates = groups
      .filter((group) => group.kind !== 'plain' && group.kind !== 'place')
      .map((group) => {
        const point = projection.fromCoordToOffset(
          new api.LatLng(group.position.lat, group.position.lng),
        );
        return { id: group.key, x: point.x, y: point.y, label: group.label };
      });
    const selectedKey = groups.find((group) => group.isSelected)?.key;
    return findCollapsedLabels(candidates, selectedKey ? [selectedKey] : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zoom은 값이 아니라 다시 계산하라는 신호다.
  }, [handle, groups, zoom]);

  useEffect(() => {
    if (!handle) return;
    const { api, map } = handle;
    const current = entries.current;
    const keys = new Set(groups.map((group) => group.key));
    for (const [key, entry] of current) {
      if (keys.has(key)) continue;
      runCleanup(() => api.Event.removeListener(entry.listeners));
      runCleanup(() => entry.marker.setMap(null));
      current.delete(key);
    }
    for (const group of groups) {
      const display: MarkerDisplay = group.isSelected
        ? 'selected'
        : group.key === hoveredKey
          ? 'hover'
          : collapsed.has(group.key)
            ? 'dot'
            : 'label';
      const contentKey = `${group.kind}|${group.label}|${group.badge ?? ''}|${display}`;
      const existing = current.get(group.key);
      if (existing?.key === contentKey) continue;
      const icon = {
        content: createMarkerContent({
          kind: group.kind,
          label: group.label,
          badge: group.badge,
          display,
        }),
        anchor: new api.Point(0, 0),
      };
      if (existing) {
        existing.marker.setIcon(icon);
        existing.marker.setZIndex(Z_INDEX[display]);
        existing.key = contentKey;
        continue;
      }
      const created = new api.Marker({
        map,
        position: new api.LatLng(group.position.lat, group.position.lng),
        icon,
        zIndex: Z_INDEX[display],
      });
      const { key } = group;
      current.set(key, {
        marker: created,
        key: contentKey,
        listeners: [
          api.Event.addListener(created, 'click', () => select(key)),
          api.Event.addListener(created, 'mouseover', () => setHoveredKey(key)),
          api.Event.addListener(created, 'mouseout', () =>
            setHoveredKey((value) => (value === key ? null : value)),
          ),
        ],
      });
    }
  }, [handle, groups, hoveredKey, collapsed]);

  useEffect(() => {
    if (!handle) return;
    const current = entries.current;
    return () => {
      for (const entry of current.values()) {
        runCleanup(() => handle.api.Event.removeListener(entry.listeners));
        runCleanup(() => entry.marker.setMap(null));
      }
      current.clear();
    };
  }, [handle]);
}
