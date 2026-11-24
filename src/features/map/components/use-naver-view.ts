'use client';

import { useEffect, useEffectEvent, useRef } from 'react';

import { isWithinView, type LatLng } from '@/features/map/map-geo';
import { runCleanup } from '@/features/map/naver-sdk';
import type { NaverCircle } from '@/features/map/naver-types';

import type { MapMarker } from './marker-icon';
import {
  type MapSearchArea,
  type NaverHandle,
  toNaverBounds,
} from './use-naver-map';

const PAN_PADDING = 48;

/** SVG 선 색에는 CSS 변수를 쓸 수 없어 토큰 값을 읽어 넘긴다. */
const tokenColor = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function isHidden({ map }: NaverHandle) {
  const { width, height } = map.getSize();
  return width === 0 || height === 0;
}

/**
 * 검색 원을 그리고 검색 영역이 바뀌면 원이 보이게 맞춘다. 목록에서 고른 병원이 화면 밖이면 그쪽으로 옮기고,
 * 모바일 지도/목록 전환으로 숨었다 보이면 크기를 다시 재고 검색 영역에 다시 맞춘다.
 */
export function useNaverView({
  handle,
  container,
  search,
  markers,
  selectedId,
  userPosition,
  onMoveEnd,
  isReducedMotion,
  showArea = true,
}: {
  handle: NaverHandle | null;
  container: HTMLDivElement | null;
  search: MapSearchArea;
  markers: MapMarker[];
  selectedId: string | null;
  userPosition: LatLng | null;
  onMoveEnd: (center: LatLng) => void;
  isReducedMotion: boolean;
  /** 검색 반경 원을 그릴지. 병원 한 곳의 위치처럼 반경이 뜻이 없으면 끈다. */
  showArea?: boolean;
}) {
  const fittedSearch = useRef(search);
  const selectedPosition = useRef<LatLng | null>(null);
  const reportMove = useEffectEvent((center: LatLng) => onMoveEnd(center));

  const panToSelected = useEffectEvent((animate: boolean) => {
    const position = selectedPosition.current;
    if (!handle || !position || isHidden(handle)) return;
    const { api, map } = handle;
    const target = new api.LatLng(position.lat, position.lng);
    const projection = map.getProjection();
    const isInside = isWithinView(
      projection.fromCoordToOffset(target),
      projection.fromCoordToOffset(map.getCenter()),
      map.getSize(),
      PAN_PADDING,
    );
    if (isInside) return;
    if (animate) map.panTo(target);
    else map.setCenter(target);
  });

  useEffect(() => {
    if (!handle) return;
    const { api, map } = handle;
    const listener = api.Event.addListener(map, 'idle', () => {
      if (isHidden(handle)) return;
      const center = map.getCenter();
      reportMove({ lat: center.lat(), lng: center.lng() });
    });
    return () => runCleanup(() => api.Event.removeListener(listener));
  }, [handle]);

  useEffect(() => {
    if (!handle || !container) return;
    const { api, map } = handle;
    let wasHidden = isHidden(handle);
    const observer = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) {
        wasHidden = true;
        return;
      }
      map.setSize(new api.Size(clientWidth, clientHeight));
      if (!wasHidden) return;
      wasHidden = false;
      map.fitBounds(toNaverBounds(api, fittedSearch.current));
      panToSelected(false);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [handle, container]);

  const circle = useRef<NaverCircle | null>(null);
  useEffect(() => {
    if (!handle || !showArea) return;
    const { api, map } = handle;
    const primary = tokenColor('--color-primary');
    const area = fittedSearch.current;
    const created = new api.Circle({
      map,
      center: new api.LatLng(area.center.lat, area.center.lng),
      radius: area.radius,
      strokeColor: primary,
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      strokeStyle: 'shortdash',
      fillColor: primary,
      fillOpacity: 0.08,
      clickable: false,
    });
    circle.current = created;
    return () => {
      runCleanup(() => created.setMap(null));
      circle.current = null;
    };
  }, [handle, showArea]);

  useEffect(() => {
    if (!handle) return;
    const { api, map } = handle;
    circle.current?.setCenter(
      new api.LatLng(search.center.lat, search.center.lng),
    );
    circle.current?.setRadius(search.radius);
    if (search === fittedSearch.current) return;
    fittedSearch.current = search;
    if (!isHidden(handle)) map.fitBounds(toNaverBounds(api, search));
  }, [handle, search]);

  const userLat = userPosition?.lat;
  const userLng = userPosition?.lng;
  useEffect(() => {
    if (!handle || userLat === undefined || userLng === undefined) return;
    const { api, map } = handle;
    const content = document.createElement('span');
    content.setAttribute('aria-hidden', 'true');
    content.className =
      'absolute top-0 left-0 block size-4 -translate-1/2 rounded-full border-3 border-bg bg-primary shadow-float ring-4 ring-primary/20';
    const marker = new api.Marker({
      map,
      position: new api.LatLng(userLat, userLng),
      icon: { content, anchor: new api.Point(0, 0) },
      zIndex: 500,
      clickable: false,
    });
    return () => runCleanup(() => marker.setMap(null));
  }, [handle, userLat, userLng]);

  const selected = markers.find((marker) => marker.id === selectedId);
  const selectedLat = selected?.position.lat;
  const selectedLng = selected?.position.lng;
  useEffect(() => {
    selectedPosition.current =
      selectedLat === undefined || selectedLng === undefined
        ? null
        : { lat: selectedLat, lng: selectedLng };
    panToSelected(!isReducedMotion);
  }, [selectedId, selectedLat, selectedLng, isReducedMotion]);
}
