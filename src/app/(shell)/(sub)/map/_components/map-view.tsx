'use client';

import { LocateFixed, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LazyHospitalMap } from '@/features/map/components/lazy-hospital-map';
import type { MapParams } from '@/features/map/map-params';
import { cn } from '@/lib/utils';

import { isSideBySide, scrollListTo } from './list-scroll';
import { LocationNoticeBanner } from './location-notice-banner';
import { MapToolbar, type MobileView } from './map-toolbar';
import { hospitalCardId, NearbyList } from './nearby-list';
import { useMapSearch } from './use-map-search';
import { useNearbyResults } from './use-nearby-results';

/**
 * S-07 지도 탐색. 목록이 주 수단이고 지도는 위치를 보여 주는 보조 수단이다. 선택은 지도와 목록이 함께 쓴다.
 * 데스크톱은 옆 목록 열, 모바일 지도 보기는 지도 아래 시트(안에서 스크롤해 지도가 끌려가지 않음)에 목록이 있다.
 */
export function MapView({ initialParams }: { initialParams: MapParams }) {
  const t = useTranslations('map');
  const item = initialParams.item;
  const state = useMapSearch(initialParams);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 모바일은 지도와 목록을 함께 두면 화면을 넘기다 지도가 끌려가서 하나씩 보여 준다. 항목을 골라 왔으면 가격 목록부터. */
  const [view, setView] = useState<MobileView>(item ? 'list' : 'map');

  const { query, hospitals, markers } = useNearbyResults(state.search, item);

  const activeId = hospitals.some((hospital) => hospital.ykiho === selectedId)
    ? selectedId
    : null;

  /** 지도에서 고르면 옆 목록 열(모바일은 지도 아래 시트)에서 그 행이 보이게 옮긴다. 지도는 이 둘 중 하나와 늘 함께 보인다. */
  const handleMarkerSelect = useCallback((id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => scrollListTo(hospitalCardId(id)));
  }, []);

  /** 지도가 함께 보이면(데스크톱, 모바일 시트) 켜고 끄는 토글이고, 모바일 목록 보기에서는 고른 뒤 지도 보기로 넘어간다. */
  function handleShowOnMap(id: string) {
    if (isSideBySide() || view === 'map') {
      setSelectedId((current) => (current === id ? null : id));
      return;
    }
    setSelectedId(id);
    handleViewChange('map');
    requestAnimationFrame(() => scrollListTo(hospitalCardId(id)));
  }

  /** 지도 보기는 화면 높이에 맞춰 그리므로 맨 위로 올리고, 목록으로 돌아오면 고른 카드를 보여 준다. */
  function handleViewChange(next: MobileView) {
    setView(next);
    if (next === 'map') window.scrollTo({ top: 0 });
    if (next !== 'list' || !activeId) return;
    requestAnimationFrame(() => {
      document
        .getElementById(hospitalCardId(activeId))
        ?.scrollIntoView({ block: 'center' });
    });
  }

  return (
    <div
      className={cn(
        'flex flex-col md:h-[calc(100dvh-var(--spacing-top-bar)-env(safe-area-inset-top,0px))] md:min-h-120 lg:h-[calc(100dvh-var(--spacing-top-nav))]',
        view === 'map' &&
          'h-[calc(100dvh-var(--spacing-top-bar)-env(safe-area-inset-top,0px))] min-h-120',
      )}
    >
      <MapToolbar
        item={item}
        region={initialParams.region}
        radius={state.radius}
        onRadiusChange={state.changeRadius}
        view={view}
        onViewChange={handleViewChange}
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
      <div className="flex min-h-0 flex-1 flex-col md:flex-row-reverse">
        <div
          className={cn(
            'relative min-h-0 flex-1 md:block',
            view === 'list' && 'hidden',
          )}
        >
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
                  className="rounded-full border border-border-strong shadow-float"
                >
                  <LocateFixed aria-hidden="true" />
                </Button>
              }
              fallbackAction={
                <Button
                  variant="tint"
                  size="md"
                  onClick={() => handleViewChange('list')}
                  className="md:hidden"
                >
                  {t('view.showList')}
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
          onShowOnMap={handleShowOnMap}
          onRadiusChange={state.changeRadius}
          onExpand={() => handleViewChange('list')}
          isSheet={view === 'map'}
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
