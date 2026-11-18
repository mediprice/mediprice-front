'use client';

import { MapPinOff, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import type { LatLng } from '../map-geo';
import { useReducedMotion } from '../use-reduced-motion';
import type { MapMarker } from './marker-icon';
import { type MapSearchArea, useNaverMap } from './use-naver-map';
import { useNaverMarkers } from './use-naver-markers';
import { useNaverView } from './use-naver-view';

export type HospitalMapProps = {
  /** 바뀌면 지도가 이 원이 보이게 맞춘다. 같은 객체를 다시 넘기면 움직이지 않는다. */
  search: MapSearchArea;
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 사용자가 지도를 옮기거나 확대한 뒤의 중심. */
  onMoveEnd: (center: LatLng) => void;
  userPosition?: LatLng | null;
  /** 오른쪽 아래 확대 버튼 위에 쌓을 조작(내 위치 등). */
  controls?: ReactNode;
  /** 지도를 못 불러왔을 때 안내 아래에 둘 행동(모바일 "목록 보기" 등). */
  fallbackAction?: ReactNode;
};

/**
 * 지도 SDK(네이버 지도 v3)는 이 컴포넌트와 use-naver-* 훅 안에만 둔다. 다른 지도로 바꿀 때는 같은 props로
 * 이 컴포넌트만 다시 만든다. 지도는 보조 수단이고 모든 정보는 목록에서도 볼 수 있다.
 */
export function HospitalMap({
  search,
  markers,
  selectedId,
  onSelect,
  onMoveEnd,
  userPosition = null,
  controls,
  fallbackAction,
}: HospitalMapProps) {
  const t = useTranslations('map.mapControls');
  const isReducedMotion = useReducedMotion();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const { handle, status } = useNaverMap(container, search);
  useNaverMarkers(handle, markers, selectedId, onSelect);
  useNaverView({
    handle,
    container,
    search,
    markers,
    selectedId,
    userPosition,
    onMoveEnd,
    isReducedMotion,
  });

  if (status === 'unavailable') {
    return (
      <div
        role="status"
        className="flex size-full flex-col items-center justify-center gap-2 bg-surface px-6 text-center"
      >
        <MapPinOff
          aria-hidden="true"
          className="size-7 text-text-tertiary"
          strokeWidth={1.75}
        />
        <p className="text-subheading">{t('unavailableTitle')}</p>
        <p className="text-body-sm text-text-secondary">
          {t('unavailableDescription')}
        </p>
        {fallbackAction && <div className="mt-2">{fallbackAction}</div>}
      </div>
    );
  }

  return (
    <div className="relative isolate size-full">
      <div
        ref={setContainer}
        role="region"
        aria-label={t('label')}
        className="size-full bg-surface-strong"
      />
      {status === 'loading' && (
        <Skeleton className="absolute inset-0 size-full rounded-none" />
      )}
      {handle && (
        <div className="absolute right-3 bottom-10 flex flex-col items-end gap-3">
          {controls}
          <div className="flex flex-col overflow-hidden rounded-xl border border-border-strong bg-bg shadow-float">
            <button
              type="button"
              aria-label={t('zoomIn')}
              onClick={() =>
                handle.map.setZoom(handle.map.getZoom() + 1, !isReducedMotion)
              }
              className="flex size-11 items-center justify-center text-text-primary hover:bg-surface active:bg-surface-strong"
            >
              <Plus aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </button>
            <span aria-hidden="true" className="h-px bg-hairline" />
            <button
              type="button"
              aria-label={t('zoomOut')}
              onClick={() =>
                handle.map.setZoom(handle.map.getZoom() - 1, !isReducedMotion)
              }
              className="flex size-11 items-center justify-center text-text-primary hover:bg-surface active:bg-surface-strong"
            >
              <Minus aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
