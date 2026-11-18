'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { LocateFixed, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/features/history/components/confirm-dialog';
import type { MapMarker } from '@/features/map/components/hospital-map';
import { LazyHospitalMap } from '@/features/map/components/lazy-hospital-map';
import type { MapParams } from '@/features/map/map-params';
import { mapQueries, type NearbyHospital } from '@/features/map/queries';

import { LocationNoticeBanner } from './location-notice-banner';
import { MapToolbar } from './map-toolbar';
import { hospitalCardId, NearbyList } from './nearby-list';
import { useMapSearch } from './use-map-search';

const PLACEHOLDER_SEARCH = { lat: 0, lng: 0, radius: 0 };

/** S-07 지도 탐색. 목록이 주 수단이고 지도는 위치를 보여 주는 보조 수단이다. 선택은 지도와 목록이 함께 쓴다. */
export function MapView({ initialParams }: { initialParams: MapParams }) {
  const t = useTranslations('map');
  const tPrice = useTranslations('common.price');
  const item = initialParams.item;
  const state = useMapSearch(initialParams);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useInfiniteQuery({
    ...mapQueries.nearby({
      ...(state.search
        ? { ...state.search.center, radius: state.search.radius }
        : PLACEHOLDER_SEARCH),
      ...(item && { npayCode: item }),
    }),
    enabled: state.search !== null,
  });

  const hospitals = useMemo(() => {
    const seen = new Set<string>();
    const list: NearbyHospital[] = [];
    for (const hospital of query.data?.pages.flatMap((page) => page.content) ??
      []) {
      if (seen.has(hospital.ykiho)) continue;
      seen.add(hospital.ykiho);
      list.push(hospital);
    }
    return list;
  }, [query.data]);

  const markers = useMemo<MapMarker[]>(
    () =>
      hospitals.flatMap((hospital) => {
        if (hospital.latitude === null || hospital.longitude === null)
          return [];
        const label = !item
          ? hospital.name
          : hospital.minPrice === null
            ? tPrice('none')
            : tPrice('won', { amount: hospital.minPrice });
        const kind = !item
          ? 'plain'
          : hospital.minPrice === null
            ? 'noPrice'
            : 'price';
        return [
          {
            id: hospital.ykiho,
            position: { lat: hospital.latitude, lng: hospital.longitude },
            kind,
            label,
          },
        ];
      }),
    [hospitals, item, tPrice],
  );

  const activeId = hospitals.some((hospital) => hospital.ykiho === selectedId)
    ? selectedId
    : null;

  /** 지도에서 고르면 데스크톱 목록 열에서 그 카드가 보이게 옮긴다. 모바일은 지도 아래 "선택한 병원"이 대신한다. */
  const handleMarkerSelect = useCallback((id: string) => {
    setSelectedId(id);
    if (!window.matchMedia('(min-width: 64rem)').matches) return;
    requestAnimationFrame(() => {
      document
        .getElementById(hospitalCardId(id))
        ?.scrollIntoView({ block: 'nearest' });
    });
  }, []);

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-var(--spacing-top-nav))]">
      <MapToolbar
        item={item}
        region={initialParams.region}
        radius={state.radius}
        onRadiusChange={state.changeRadius}
      />
      {state.notice && (
        <LocationNoticeBanner
          notice={state.notice}
          item={item}
          region={initialParams.region}
          isRetrying={state.isLocating}
          onRetry={state.retryLocation}
          onDismiss={state.dismissNotice}
        />
      )}
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row-reverse">
        <div className="relative h-[58dvh] min-h-80 lg:h-auto lg:min-h-0 lg:flex-1">
          {state.search && (
            <LazyHospitalMap
              search={state.search}
              markers={markers}
              selectedId={activeId}
              onSelect={handleMarkerSelect}
              onMoveEnd={state.setMapCenter}
              userPosition={state.userPosition}
              controls={
                <Button
                  variant="onTint"
                  size="icon"
                  aria-label={
                    state.isLocating
                      ? t('actions.locating')
                      : t('actions.myLocation')
                  }
                  isLoading={state.isLocating}
                  onClick={state.requestLocation}
                  className="rounded-full shadow-card"
                >
                  <LocateFixed aria-hidden="true" />
                </Button>
              }
            />
          )}
          {state.canSearchHere && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
              <Button
                variant="onTint"
                size="md"
                onClick={state.searchHere}
                className="pointer-events-auto rounded-full border border-border-strong shadow-float"
              >
                <RotateCw aria-hidden="true" />
                {t('actions.searchHere')}
              </Button>
            </div>
          )}
        </div>
        <NearbyList
          query={query}
          hospitals={hospitals}
          item={item}
          radius={state.radius}
          isSearching={state.search === null}
          selectedId={activeId}
          onSelect={setSelectedId}
          onRadiusChange={state.changeRadius}
        />
      </div>
      <ConfirmDialog
        open={state.isPromptOpen}
        onOpenChange={(open) => {
          if (!open) state.answerPrompt(false);
        }}
        title={t('location.promptTitle')}
        description={t('location.promptDescription')}
        cancelLabel={t('location.promptLater')}
        confirmLabel={t('location.promptAllow')}
        confirmVariant="primary"
        cancelVariant="tint"
        onConfirm={() => state.answerPrompt(true)}
      />
    </div>
  );
}
