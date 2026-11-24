'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { openLoginDialog } from '@/features/auth/login-dialog-store';
import {
  type EntryStep,
  locationEntryStep,
} from '@/features/map/location-access';
import {
  clampToKorea,
  hasMovedAway,
  type LatLng,
  type RadiusOption,
  regionCenter,
  roundLatLng,
} from '@/features/map/map-geo';
import { buildMapQuery, type MapParams } from '@/features/map/map-params';
import {
  savePendingLocation,
  takePendingLocation,
} from '@/features/map/pending-location';
import { locationUsageMutations } from '@/features/map/queries';
import { useGeolocation } from '@/features/map/use-geolocation';

import { useLocationAccess } from './use-location-access';
import { useLocationConsent } from './use-location-consent';

/** deferred: 현재 위치를 쓰지 않고 지역 중심(서울시청 등)을 보고 있다. "내 위치 사용"으로 이어 간다. */
export type LocationNotice = 'denied' | 'unavailable' | 'outside' | 'deferred';
/** 지도가 맞출 검색 영역. 사용자 동작마다 새 객체라서 같은 곳을 다시 골라도 지도가 돌아온다. */
export type MapSearch = { center: LatLng; radius: RadiusOption };
type CenterSource = 'url' | 'area' | 'location' | 'fallback';

const currentPath = () => window.location.pathname + window.location.search;

/**
 * 검색 중심을 URL(공유한 지역) → 현재 위치 → 지역 중심 순서로 정한다. 현재 위치는 로그인 + 위치 동의 + 브라우저 권한이
 * 모두 있을 때만 읽는다(docs 13.5). 권한이 이미 있으면 로그인·동의 상태와 위치를 받을 때까지 조회를 미뤄 요청이 두 번
 * 나가지 않게 한다. 현재 위치는 URL에 남기지 않는다(공유 링크로 새지 않게).
 */
export function useMapSearch(initial: MapParams) {
  const [search, setSearch] = useState<MapSearch | null>(
    initial.center ? { center: initial.center, radius: initial.radius } : null,
  );
  const [source, setSource] = useState<CenterSource>(
    initial.center ? 'url' : 'fallback',
  );
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [notice, setNotice] = useState<LocationNotice | null>(null);
  const queryClient = useQueryClient();
  const { mutate: recordUsage } = useMutation(
    locationUsageMutations.record(queryClient),
  );
  const access = useLocationAccess();
  const geo = useGeolocation();
  const consent = useLocationConsent({
    onAgreed: () => void locate(),
    /** 동의 창을 닫으면 지역 기준 그대로 두고 그 사실을 알린다. */
    onDeclined: () => {
      if (source === 'fallback') setNotice((current) => current ?? 'deferred');
    },
  });
  const radius = search?.radius ?? initial.radius;
  /** 진입 판단은 화면마다 한 번만 한다. 공유한 지역(URL)으로 들어오면 하지 않는다. */
  const [entry, setEntry] = useState<EntryStep | 'shared'>(
    initial.center ? 'shared' : 'wait',
  );
  const hasResumed = useRef(false);

  /** 세션·동의 상태가 권한보다 늦게 오면 그때 다시 판단한다(locationEntryStep이 기다리라고 하는 동안은 조회하지 않는다). */
  if (entry === 'wait') {
    const step = locationEntryStep({ access, permission: geo.permission });
    if (step !== 'wait') {
      setEntry(step);
      if (step !== 'locate') {
        showFallbackIfEmpty();
        setNotice(step === 'denied' ? 'denied' : 'deferred');
      }
    }
  }

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
      /** 이용 기록은 검색과 따로 한 번만 보낸다. 실패해도 검색은 그대로 두고 다시 보내지 않는다. */
      recordUsage();
      return;
    }
    setNotice(result.status);
    showFallbackIfEmpty();
  }

  /** 로그인하지 않았으면 로그인 창, 동의가 없으면 동의 창, 둘 다 있으면 위치를 찾는다(권한을 묻지 않았으면 브라우저가 묻는다). */
  function requestLocation() {
    if (access === null) return;
    if (access === 'signedOut') {
      savePendingLocation(currentPath());
      openLoginDialog({ reason: 'location' });
    } else if (access === 'needsConsent') {
      consent.open();
    } else {
      void locate();
    }
  }

  const locateOnEntry = useEffectEvent(() => void locate());
  useEffect(() => {
    if (entry === 'locate') locateOnEntry();
  }, [entry]);

  /** 로그인하고(또는 약관을 보고) 같은 화면으로 돌아왔으면 누르던 "내 위치 사용"을 한 번 이어 한다. */
  const resumeOnce = useEffectEvent(() => {
    if (hasResumed.current || entry === 'wait') return;
    if (access === null || access === 'signedOut') return;
    hasResumed.current = true;
    if (takePendingLocation(currentPath()) && entry !== 'locate')
      requestLocation();
  });
  useEffect(() => resumeOnce(), [access, entry]);

  function replaceUrl(center: LatLng | null, nextRadius: RadiusOption) {
    const query = buildMapQuery({ ...initial, center, radius: nextRadius });
    window.history.replaceState(
      window.history.state,
      '',
      query ? `/map?${query}` : '/map',
    );
  }

  return {
    search,
    radius,
    notice,
    dismissNotice: () => setNotice(null),
    userPosition:
      geo.location.status === 'located' ? geo.location.position : null,
    isLocating: geo.location.status === 'locating',
    /** 로그인·동의 상태를 확인하는 동안은 "내 위치 사용"을 눌러도 할 일을 정할 수 없어 불러오는 중으로 보인다. */
    isCheckingAccess: access === null,
    requestLocation,
    consent,
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
