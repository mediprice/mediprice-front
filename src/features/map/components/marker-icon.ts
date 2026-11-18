import { divIcon } from 'leaflet';

import { cn } from '@/lib/utils';

export type MapMarkerKind = 'price' | 'noPrice' | 'plain';

const PILL =
  'absolute top-0 left-0 inline-flex min-h-8 -translate-1/2 items-center rounded-full border px-3 whitespace-nowrap text-caption-bold tabular-nums shadow-card';

const KIND_CLASS: Record<MapMarkerKind, string> = {
  price: 'border-border bg-bg text-text-primary',
  noPrice: 'border-dashed border-border-strong bg-bg text-text-secondary',
  plain:
    'absolute top-0 left-0 block size-4 -translate-1/2 rounded-full border-2 border-bg bg-primary shadow-card',
};

const SELECTED_CLASS =
  'z-10 border-primary bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-bg';

/**
 * 마커는 이미지 대신 DOM으로 그린다(번들러에서 Leaflet 기본 이미지 경로가 깨진다). 같은 내용이 목록에 있어
 * 스크린 리더에서는 숨긴다. 문구는 textContent로 넣어 HTML로 해석되지 않는다.
 */
export function createMarkerIcon({
  kind,
  label,
  isSelected,
}: {
  kind: MapMarkerKind;
  label: string;
  isSelected: boolean;
}) {
  const element = document.createElement('span');
  element.setAttribute('aria-hidden', 'true');
  const showsLabel = kind !== 'plain' || isSelected;
  element.className = showsLabel
    ? cn(
        PILL,
        KIND_CLASS[kind === 'plain' ? 'price' : kind],
        isSelected && SELECTED_CLASS,
      )
    : KIND_CLASS.plain;
  if (showsLabel) element.textContent = label;
  return divIcon({ html: element, className: '', iconSize: [0, 0] });
}
