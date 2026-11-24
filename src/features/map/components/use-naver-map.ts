'use client';

import { useEffect, useState } from 'react';

import { env } from '@/env';
import {
  boundsAround,
  KOREA_BOUNDS,
  type LatLng,
} from '@/features/map/map-geo';
import {
  loadNaverMaps,
  onNaverAuthFailure,
  runCleanup,
} from '@/features/map/naver-sdk';
import type { NaverMap, NaverMapsApi } from '@/features/map/naver-types';

export type NaverHandle = { api: NaverMapsApi; map: NaverMap };
type MapStatus = 'loading' | 'ready' | 'unavailable';
export type MapSearchArea = { center: LatLng; radius: number };

const INITIAL_ZOOM = 14;

export function toNaverBounds(api: NaverMapsApi, area: MapSearchArea) {
  const { south, west, north, east } = boundsAround(area.center, area.radius);
  return new api.LatLngBounds(
    new api.LatLng(south, west),
    new api.LatLng(north, east),
  );
}

/**
 * SDK를 불러와 지도를 만든다. 키가 없거나, 스크립트를 못 받았거나, 인증에 실패하면 'unavailable'이고
 * 화면은 지도 없이 목록으로 계속 쓸 수 있다.
 */
export function useNaverMap(
  container: HTMLDivElement | null,
  initialArea: MapSearchArea,
) {
  const clientId = env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const [handle, setHandle] = useState<NaverHandle | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [initial] = useState(initialArea);

  useEffect(() => {
    if (!clientId || !container) return;
    let isActive = true;
    let created: NaverMap | null = null;
    let logoObserver: MutationObserver | null = null;
    const unsubscribe = onNaverAuthFailure(() => setHasFailed(true));
    loadNaverMaps(clientId).then(
      (api) => {
        if (!isActive) return;
        created = new api.Map(container, {
          center: new api.LatLng(initial.center.lat, initial.center.lng),
          zoom: INITIAL_ZOOM,
          minZoom: 7,
          maxBounds: new api.LatLngBounds(
            new api.LatLng(KOREA_BOUNDS.south - 0.5, KOREA_BOUNDS.west - 0.5),
            new api.LatLng(KOREA_BOUNDS.north + 0.5, KOREA_BOUNDS.east + 0.5),
          ),
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          logoControl: true,
          logoControlOptions: { position: api.Position.BOTTOM_LEFT },
          mapDataControl: true,
          mapDataControlOptions: { position: api.Position.BOTTOM_LEFT },
        });
        created.fitBounds(toNaverBounds(api, initial));
        logoObserver = keepNaverLinksOutOfTabOrder(container);
        setHandle({ api, map: created });
      },
      () => {
        if (isActive) setHasFailed(true);
      },
    );
    return () => {
      isActive = false;
      unsubscribe();
      logoObserver?.disconnect();
      runCleanup(() => created?.destroy());
      setHandle(null);
    };
  }, [clientId, container, initial]);

  const status: MapStatus =
    !clientId || hasFailed ? 'unavailable' : handle ? 'ready' : 'loading';
  return { handle: status === 'ready' ? handle : null, status };
}

/**
 * 네이버 로고·지도 데이터 링크(외부 사이트)는 보이게 두되 Tab 순서에서는 뺀다. 키보드 사용자가 본문 대신
 * 10px짜리 이름 없는 링크부터 지나지 않게 한다. SDK가 나중에 그리므로 바뀔 때마다 다시 적용한다.
 */
function keepNaverLinksOutOfTabOrder(container: HTMLElement) {
  const apply = () => {
    for (const link of container.querySelectorAll<HTMLAnchorElement>(
      'a[href*="naver"]',
    )) {
      if (link.tabIndex !== -1) link.tabIndex = -1;
    }
  };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(container, { childList: true, subtree: true });
  return observer;
}
