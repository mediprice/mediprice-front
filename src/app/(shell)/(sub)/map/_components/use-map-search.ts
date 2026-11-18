'use client';

import { useState } from 'react';

import type { LocationPermission } from '@/features/map/geolocation';
import {
  clampToKorea,
  hasMovedAway,
  type LatLng,
  type RadiusOption,
  regionCenter,
  roundLatLng,
} from '@/features/map/map-geo';
import { buildMapQuery, type MapParams } from '@/features/map/map-params';
import { useGeolocation } from '@/features/map/use-geolocation';

export type LocationNotice = 'denied' | 'unavailable' | 'outside';
/** 지도가 맞출 검색 영역. 사용자 동작마다 새 객체라서 같은 곳을 다시 골라도 지도가 돌아온다. */
export type MapSearch = { center: LatLng; radius: RadiusOption };
type CenterSource = 'url' | 'area' | 'location' | 'fallback';

const PROMPT_DISMISSED_KEY = 'mediprice:map-location-prompt-dismissed';

/**
 * 검색 중심을 URL(공유한 지역) → 현재 위치 → 지역 중심 순서로 정한다. 권한이 이미 있으면 위치를 받을 때까지
 * 조회를 미뤄 요청이 두 번 나가지 않게 한다. 현재 위치는 URL에 남기지 않는다(공유 링크로 새지 않게).
 */
export function useMapSearch(initial: MapParams) {
  const [search, setSearch] = useState<MapSearch | null>(
    initial.center ? { center: initial.center, radius: initial.radius } : null,
  );
  const [source, setSource] = useState<CenterSource>(
    initial.center ? 'url' : 'fallback',
  );
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [notice, setNotice] = useState<LocationNotice | null>(null);
  const geo = useGeolocation({ onPermissionReady: start });
  const radius = search?.radius ?? initial.radius;

  function moveTo(center: LatLng, nextSource: CenterSource) {
    setSearch({ center, radius });
    setSource(nextSource);
  }

  /** 위치를 못 쓰면 이미 보고 있던 곳을 그대로 두고, 아직 아무것도 없으면 지역 중심을 보여 준다. */
  function showFallbackIfEmpty() {
    setSearch(
      (current) =>
        current ?? {
          center: regionCenter(initial.region),
          radius: initial.radius,
        },
    );
  }

  async function locate() {
    const result = await geo.locate();
    if (!result) return;
    if (result.status === 'located') {
      moveTo(result.position, 'location');
      setNotice(null);
      return;
    }
    setNotice(result.status);
    showFallbackIfEmpty();
  }

  function start(permission: Exclude<LocationPermission, 'checking'>) {
    if (initial.center) return;
    if (permission === 'granted') {
      void locate();
      return;
    }
    showFallbackIfEmpty();
    if (permission === 'denied') {
      setNotice('denied');
    } else if (sessionStorage.getItem(PROMPT_DISMISSED_KEY) === null) {
      setIsPromptOpen(true);
    }
  }

  function replaceUrl(center: LatLng | null, nextRadius: RadiusOption) {
    const query = buildMapQuery({ ...initial, center, radius: nextRadius });
    window.history.replaceState(null, '', query ? `/map?${query}` : '/map');
  }

  return {
    search,
    radius,
    notice,
    dismissNotice: () => setNotice(null),
    userPosition:
      geo.location.status === 'located' ? geo.location.position : null,
    isLocating: geo.location.status === 'locating',
    isPromptOpen,
    /** 권한을 아직 묻지 않았으면 왜 필요한지 먼저 설명하고, 그 밖에는 바로 위치를 찾는다. */
    requestLocation: () => {
      if (geo.permission === 'prompt' || geo.permission === 'unsupported') {
        setIsPromptOpen(true);
      } else {
        void locate();
      }
    },
    answerPrompt: (isAllowed: boolean) => {
      setIsPromptOpen(false);
      if (isAllowed) {
        void locate();
      } else {
        sessionStorage.setItem(PROMPT_DISMISSED_KEY, '1');
      }
    },
    retryLocation: () => void locate(),
    setMapCenter,
    canSearchHere:
      search !== null &&
      mapCenter !== null &&
      hasMovedAway(search.center, mapCenter, radius),
    searchHere: () => {
      if (!mapCenter) return;
      const center = roundLatLng(clampToKorea(mapCenter));
      moveTo(center, 'area');
      setNotice(null);
      replaceUrl(center, radius);
    },
    changeRadius: (next: RadiusOption) => {
      if (!search) return;
      setSearch({ center: search.center, radius: next });
      const isShared = source === 'url' || source === 'area';
      replaceUrl(isShared ? search.center : null, next);
    },
  };
}
