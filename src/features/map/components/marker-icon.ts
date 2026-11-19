import { cn } from '@/lib/utils';

import type { LatLng } from '../map-geo';

export type MapMarkerKind = 'price' | 'noPrice' | 'plain';

export type MapMarker = {
  id: string;
  position: LatLng;
  kind: MapMarkerKind;
  /** 마커에 보일 짧은 문구(가격, 또는 고른 병원의 이름). 번역한 문자열을 넘긴다. */
  label: string;
};

/** label: 글자 알약(항목이 없으면 점), dot: 겹쳐서 점으로 줄임, hover: 마우스를 올림, selected: 목록과 함께 고른 것. */
export type MarkerDisplay = 'label' | 'dot' | 'hover' | 'selected';

const PILL =
  'absolute top-0 left-0 inline-flex min-h-8 -translate-x-1/2 -translate-y-1/2 items-center rounded-full border px-3 whitespace-nowrap text-caption-bold tabular-nums shadow-card cursor-pointer';
const DOT =
  'absolute top-0 left-0 block size-4 -translate-1/2 rounded-full border-2 border-bg shadow-card cursor-pointer';

const PILL_KIND: Record<MapMarkerKind, string> = {
  price: 'border-border bg-bg text-text-primary',
  noPrice: 'border-dashed border-border-strong bg-bg text-text-secondary',
  plain: 'border-border bg-bg text-text-primary',
};
const DOT_KIND: Record<MapMarkerKind, string> = {
  price: 'bg-primary',
  noPrice: 'bg-text-tertiary',
  plain: 'bg-primary',
};

/** 고른 마커는 색과 함께 크기·테두리 고리·아래 꼬리로도 구분한다(색만으로 구분하지 않음). */
const SELECTED =
  'min-h-9 -translate-y-[calc(50%+0.5rem)] border-primary bg-primary px-3.5 text-label-bold text-on-primary shadow-float ring-2 ring-primary ring-offset-2 ring-offset-bg after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-6 after:border-t-8 after:border-x-transparent after:border-t-primary';
const HOVER = 'border-primary text-primary-text shadow-float';

/**
 * 마커는 지도 SDK의 HTML 마커 내용으로 쓸 DOM이다. 기준점(0,0)에 두고 스스로 가운데로 옮긴다. 같은 내용이 목록에 있어
 * 스크린 리더에서는 숨긴다. 문구는 textContent로 넣어 HTML로 해석되지 않는다.
 */
export function createMarkerContent({
  kind,
  label,
  display,
}: {
  kind: MapMarkerKind;
  label: string;
  display: MarkerDisplay;
}) {
  const element = document.createElement('span');
  element.setAttribute('aria-hidden', 'true');
  element.dataset.display = display;
  if (display === 'dot' || (kind === 'plain' && display === 'label')) {
    element.className = cn(DOT, DOT_KIND[kind]);
  } else {
    element.className = cn(
      PILL,
      PILL_KIND[kind],
      display === 'hover' && HOVER,
      display === 'selected' && SELECTED,
    );
    element.textContent = label;
  }
  return element;
}
