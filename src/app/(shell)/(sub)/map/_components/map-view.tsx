'use client';

import { LocateFixed, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LazyHospitalMap } from '@/features/map/components/lazy-hospital-map';
import type { MapParams } from '@/features/map/map-params';
import { cn } from '@/lib/utils';

import { isSideBySide, scrollListTo } from './list-scroll';
import { LocationNoticeBanner } from './location-notice-banner';
import { MapToolbar, type MobileView } from './map-toolbar';
import { hospitalCardId, NearbyList } from './nearby-list';
import { SelectedHospitalPanel } from './selected-hospital-panel';
import { useMapSearch } from './use-map-search';
import { useNearbyResults } from './use-nearby-results';

const VIEW_KEY = 'mpMapView';

type SavedView = { view: MobileView; selectedId: string | null };

function readSavedView(): SavedView | null {
  const saved = (window.history.state as Record<string, unknown> | null)?.[
    VIEW_KEY
  ];
  if (!saved || typeof saved !== 'object') return null;
  const { view, selectedId } = saved as Partial<SavedView>;
  if (view !== 'list' && view !== 'map') return null;
  return {
    view,
    selectedId: typeof selectedId === 'string' ? selectedId : null,
  };
}

function savedViewKey() {
  const saved = readSavedView();
  return saved ? JSON.stringify(saved) : '';
}

const noSubscribe = () => () => {};

function saveView(value: SavedView) {
  window.history.replaceState(
    { ...window.history.state, [VIEW_KEY]: value },
    '',
    window.location.href,
  );
}

/** S-07 지도 탐색. 목록이 주 수단이고 지도는 위치를 보여 주는 보조 수단이다. 선택은 지도와 목록이 함께 쓴다. */
export function MapView({ initialParams }: { initialParams: MapParams }) {
  const t = useTranslations('map');
  const item = initialParams.item;
  const state = useMapSearch(initialParams);
  /** 병원을 열었다 뒤로 돌아오면 보던 방식과 고른 병원을 이 기록 칸에서 되살린다(주소는 지도 검색이 쓰므로 건드리지 않음). */
  const savedKey = useSyncExternalStore(noSubscribe, savedViewKey, () => '');
  const saved = savedKey ? (JSON.parse(savedKey) as SavedView) : null;
  const [chosenId, setSelectedId] = useState<string | null | undefined>();
  /** 모바일은 지도와 목록을 함께 두면 화면을 넘기다 지도가 끌려가서 하나씩 보여 준다. 항목을 골라 왔으면 가격 목록부터. */
  const [chosenView, setView] = useState<MobileView>();
  const selectedId =
    chosenId === undefined ? (saved?.selectedId ?? null) : chosenId;
  const view = chosenView ?? saved?.view ?? (item ? 'list' : 'map');
  useEffect(() => {
    if (chosenId !== undefined || chosenView !== undefined)
      saveView({ view, selectedId });
  }, [chosenId, chosenView, view, selectedId]);

  const { query, hospitals, markers } = useNearbyResults(state.search, item);

  const activeId = hospitals.some((hospital) => hospital.ykiho === selectedId)
    ? selectedId
    : null;

  const selected = hospitals.find((hospital) => hospital.ykiho === activeId);

  /** 지도에서 고르면 데스크톱 목록 열에서 그 카드가 보이게 옮긴다. 모바일은 지도 아래 "선택한 병원"이 대신한다. */
  const handleMarkerSelect = useCallback((id: string) => {
    setSelectedId(id);
    if (!isSideBySide()) return;
    requestAnimationFrame(() => scrollListTo(hospitalCardId(id)));
  }, []);

  /** 데스크톱은 지도가 옆에 있어 켜고 끄는 토글이고, 모바일은 고른 뒤 지도 보기로 넘어간다. */
  function handleShowOnMap(id: string) {
    if (isSideBySide()) {
      setSelectedId(selectedId === id ? null : id);
      return;
    }
    setSelectedId(id);
    handleViewChange('map');
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
        back={initialParams.back ?? null}
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
          back={initialParams.back ?? null}
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
                  className="rounded-full shadow-card"
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
          className={cn(view === 'map' && 'hidden md:block')}
        />
        {view === 'map' && selected && (
          <SelectedHospitalPanel
            hospital={selected}
            item={item}
            onClear={() => setSelectedId(null)}
          />
        )}
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
