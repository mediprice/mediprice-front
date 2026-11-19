import { cn } from '@/lib/utils';

import type { LatLng } from '../map-geo';

/** place는 병원이 아니라 사용자가 말한 장소(기준점)다. 늘 이름 알약으로 보이고 고를 수 없다. */
export type MapMarkerKind = 'price' | 'noPrice' | 'plain' | 'place';

export type MapMarker = {
  id: string;
  position: LatLng;
  kind: MapMarkerKind;
  /** 마커에 보일 짧은 문구(가격, 또는 고른 병원의 이름). 번역한 문자열을 넘긴다. */
  label: string;
  /** plain 점 안에 쓸 짧은 표시(목록 순번). 있으면 점이 조금 커지고 숫자를 보인다. */
  badge?: string;
};

/** label: 글자 알약(항목이 없으면 점), dot: 겹쳐서 점으로 줄임, hover: 마우스를 올림, selected: 목록과 함께 고른 것. */
export type MarkerDisplay = 'label' | 'dot' | 'hover' | 'selected';

/** 가격 핀: 점 바로 위에 뜬 알약과 아래 꼬리. 꼬리 끝이 병원 위치다. */
const PIN = [
  'absolute top-0 left-0 inline-flex min-h-8 -translate-x-1/2 -translate-y-[calc(100%+0.375rem)] cursor-pointer items-center rounded-full border px-3 text-label-bold whitespace-nowrap tabular-nums shadow-float',
  'after:absolute after:top-full after:left-1/2 after:size-2.5 after:-translate-x-1/2 after:-translate-y-[0.3125rem] after:rotate-45 after:border-r after:border-b',
].join(' ');
const DOT =
  'absolute top-0 left-0 block size-4 -translate-1/2 cursor-pointer rounded-full border-2 border-bg shadow-float';

const PIN_KIND: Record<MapMarkerKind, string> = {
  price:
    'border-border-strong bg-bg text-text-primary after:border-border-strong after:bg-bg',
  noPrice:
    'border-dashed border-border-strong bg-surface text-text-secondary after:border-border-strong after:bg-surface',
  plain:
    'border-border-strong bg-bg text-text-primary after:border-border-strong after:bg-bg',
  place:
    'cursor-default border-text-primary bg-text-primary text-bg after:border-text-primary after:bg-text-primary',
};
const DOT_KIND: Record<MapMarkerKind, string> = {
  price: 'bg-primary',
  noPrice: 'bg-text-tertiary',
  plain: 'bg-primary',
  place: 'bg-text-primary',
};

/** 고른 핀은 색과 함께 크기·굵은 테두리 고리로도 구분한다(색만으로 구분하지 않음). */
const SELECTED =
  'min-h-10 border-2 border-primary bg-primary px-4 text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-bg after:size-3 after:-translate-y-1.5 after:border-primary after:bg-primary';
const HOVER = 'border-primary text-primary-text after:border-primary';

/**
 * 마커는 지도 SDK의 HTML 마커 내용으로 쓸 DOM이다. 기준점(0,0)에 두고 스스로 가운데로 옮긴다. 같은 내용이 목록에 있어
 * 스크린 리더에서는 숨긴다. 문구는 textContent로 넣어 HTML로 해석되지 않는다.
 */
const BADGE =
  'absolute top-0 left-0 flex size-6 -translate-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-bg bg-primary text-caption-bold text-on-primary tabular-nums shadow-float';

export function createMarkerContent({
  kind,
  label,
  badge,
  display,
}: {
  kind: MapMarkerKind;
  label: string;
  badge?: string;
  display: MarkerDisplay;
}) {
  const element = document.createElement('span');
  element.setAttribute('aria-hidden', 'true');
  element.dataset.display = display;
  if (kind === 'place') {
    element.className = cn(PIN, PIN_KIND.place);
    element.textContent = label;
    return element;
  }
  if (badge && kind === 'plain' && display !== 'selected') {
    element.className = cn(BADGE, display === 'hover' && 'ring-2 ring-primary');
    element.textContent = badge;
    return element;
  }
  if (display === 'dot' || (kind === 'plain' && display === 'label')) {
    element.className = cn(DOT, DOT_KIND[kind]);
  } else {
    element.className = cn(
      PIN,
      PIN_KIND[kind],
      display === 'hover' && HOVER,
      display === 'selected' && SELECTED,
    );
    element.textContent = label;
  }
  return element;
}
