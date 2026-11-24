import type { LatLng } from '@/features/map/map-geo';
import { cn } from '@/lib/utils';

/** place는 병원이 아니라 사용자가 말한 장소(기준점)다. 늘 이름 알약으로 보이고 고를 수 없다. */
type MapMarkerKind = 'price' | 'noPrice' | 'plain' | 'place';

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

/** 점의 가운데가 병원 위치다. 글자 알약 상태에서도 점은 그대로 두고 알약을 위에 띄운다. */
const DOT =
  'absolute top-0 left-0 block size-4 -translate-1/2 cursor-pointer rounded-full border-2 border-bg shadow-card';

/**
 * 알약과 꼬리는 점 요소의 ::before·::after로 그린다. 마우스를 올려 알약이 생겨도 포인터 아래의 요소가 바뀌지 않아,
 * 같은 자리의 마커끼리 mouseover·mouseout이 번갈아 일어나지 않는다.
 */
const PIN = [
  'text-caption-bold whitespace-nowrap tabular-nums',
  'before:absolute before:bottom-[calc(100%+0.5rem)] before:left-1/2 before:inline-flex before:min-h-8 before:-translate-x-1/2 before:items-center before:rounded-full before:border before:px-3 before:shadow-card before:content-[attr(data-label)]',
  'after:absolute after:bottom-[calc(100%+0.1875rem)] after:left-1/2 after:size-2.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b',
].join(' ');

const PIN_KIND: Record<MapMarkerKind, string> = {
  price:
    'text-text-primary before:border-border before:bg-bg after:border-border after:bg-bg',
  noPrice:
    'text-text-secondary before:border-dashed before:border-border-strong before:bg-bg after:border-border-strong after:bg-bg',
  plain:
    'text-text-primary before:border-border before:bg-bg after:border-border after:bg-bg',
  place:
    'cursor-default text-bg before:border-text-primary before:bg-text-primary after:border-text-primary after:bg-text-primary',
};
const DOT_KIND: Record<MapMarkerKind, string> = {
  price: 'bg-primary',
  noPrice: 'bg-text-tertiary',
  plain: 'bg-primary',
  place: 'bg-text-primary',
};

/** 고른 핀은 색과 함께 크기·테두리 고리로도 구분한다(색만으로 구분하지 않음). */
const SELECTED =
  'text-label-bold text-on-primary before:min-h-9 before:border-primary before:bg-primary before:px-3.5 before:shadow-float before:ring-2 before:ring-primary before:ring-offset-2 before:ring-offset-bg after:bottom-[calc(100%+0.125rem)] after:size-3 after:border-primary after:bg-primary';
const HOVER =
  'text-primary-text before:border-primary before:shadow-float after:border-primary';

const BADGE =
  'absolute top-0 left-0 flex size-6 -translate-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-bg bg-primary text-caption-bold text-on-primary tabular-nums shadow-float';

type MarkerContentInput = {
  kind: MapMarkerKind;
  label: string;
  badge?: string;
  display: MarkerDisplay;
};

/** 마커 요소의 클래스와 문구. label은 알약(data-label), text는 요소 안 글자(배지 숫자)다. */
export function markerContentOf({
  kind,
  label,
  badge,
  display,
}: MarkerContentInput): { className: string; label?: string; text?: string } {
  if (badge && kind === 'plain' && display !== 'selected') {
    return {
      className: cn(BADGE, display === 'hover' && 'ring-2 ring-primary'),
      text: badge,
    };
  }
  if (
    kind !== 'place' &&
    (display === 'dot' || (kind === 'plain' && display === 'label'))
  ) {
    return { className: cn(DOT, DOT_KIND[kind]) };
  }
  return {
    className: cn(
      DOT,
      DOT_KIND[kind],
      PIN,
      PIN_KIND[kind],
      kind !== 'place' && display === 'hover' && HOVER,
      kind !== 'place' && display === 'selected' && SELECTED,
    ),
    label,
  };
}

/**
 * 마커는 지도 SDK의 HTML 마커 내용으로 쓸 DOM이다. 기준점(0,0)에 두고 스스로 가운데로 옮긴다. 같은 내용이 목록에 있어
 * 스크린 리더에서는 숨긴다. 문구는 속성·textContent로 넣어 HTML로 해석되지 않는다.
 */
export function createMarkerContent(input: MarkerContentInput) {
  const { className, label, text } = markerContentOf(input);
  const element = document.createElement('span');
  element.setAttribute('aria-hidden', 'true');
  element.dataset.display = input.display;
  element.className = className;
  if (label !== undefined) element.dataset.label = label;
  if (text !== undefined) element.textContent = text;
  return element;
}
