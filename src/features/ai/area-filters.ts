import type { LatLng } from '@/features/map/map-geo';
import type { PriceFilters } from '@/features/npay/price-filters';
import {
  DEFAULT_REGION,
  type ServiceRegion,
} from '@/features/regions/service-region';

import type { TurnArea } from './schemas';

const METRO = { '110000': 'seoul', '310000': 'gyeonggi' } as const;

/** 좌표까지 아는 장소. 그 주변 병원을 가까운 순으로 보여 준다. */
export type NearPlace = { place: string; center: LatLng };

export type AreaScope =
  /** 장소를 말하지 않아 기본 지역(서울·경기)이거나, 결과에서 사용자가 고른 지역이다. */
  | { kind: 'default'; filters: PriceFilters; near: null }
  /** 서울·경기 안이라 그 시도(와 시군구)로 좁힌다. */
  | {
      kind: 'area';
      filters: PriceFilters;
      label: string;
      near: NearPlace | null;
    }
  /** 지역 선택은 서울·경기만 되므로 그 밖의 장소는 전국으로 보여 준다. 주변 병원은 좌표로 찾으므로 그대로 보여 준다. */
  | {
      kind: 'outside';
      filters: PriceFilters;
      label: string;
      near: NearPlace | null;
    };

function nearOf(area: TurnArea): NearPlace | null {
  if (area.lat === null || area.lng === null) return null;
  return {
    place: area.place ?? area.label,
    center: { lat: area.lat, lng: area.lng },
  };
}

/** AI가 알려 준 장소를 항목 가격 화면의 필터로 바꾼다. 장소가 없으면 picked(없으면 기본 지역)를 쓴다. 시군구는 시도 코드 앞 두 자리가 같을 때만 쓴다. */
export function areaScope(
  area: TurnArea | null,
  picked: ServiceRegion = DEFAULT_REGION,
): AreaScope {
  if (!area) {
    return {
      kind: 'default',
      filters: { region: picked, sort: 'price_asc' },
      near: null,
    };
  }
  const region = METRO[area.sidoCode as keyof typeof METRO];
  if (!region) {
    return {
      kind: 'outside',
      filters: { region: 'all', sort: 'price_asc' },
      label: area.label,
      near: nearOf(area),
    };
  }
  const sggu =
    area.sgguCode && area.sgguCode.slice(0, 2) === area.sidoCode.slice(0, 2)
      ? area.sgguCode
      : undefined;
  return {
    kind: 'area',
    filters: { region, sort: 'price_asc', ...(sggu && { sggu }) },
    label: area.label,
    near: nearOf(area),
  };
}
