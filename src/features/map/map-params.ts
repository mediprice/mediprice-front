import { z } from 'zod';

import {
  parseServiceRegion,
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';

import {
  defaultRadius,
  isInKorea,
  type LatLng,
  RADIUS_OPTIONS,
  type RadiusOption,
  roundLatLng,
} from './map-geo';

export type MapParams = {
  item: string | null;
  region: ServiceRegion;
  /** URL로 받은 지도 중심. 없으면 현재 위치나 지역 중심을 쓴다. */
  center: LatLng | null;
  radius: RadiusOption;
};

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const itemSchema = z.preprocess(first, z.string().regex(/^[A-Za-z0-9]{1,20}$/));
const coordinate = z.preprocess(first, z.coerce.number().finite());
const radiusSchema = z.preprocess(
  first,
  z.coerce
    .number()
    .refine((value): value is RadiusOption =>
      (RADIUS_OPTIONS as readonly number[]).includes(value),
    ),
);

/** 검증하지 못한 값은 버린다. 범위(한국) 밖 좌표는 중심이 없는 것으로 본다. */
export function parseMapParams(
  search: Record<string, string | string[] | undefined>,
): MapParams {
  const parsedItem = itemSchema.safeParse(search.item);
  const item = parsedItem.success ? parsedItem.data : null;
  const lat = coordinate.safeParse(search.lat);
  const lng = coordinate.safeParse(search.lng);
  const center =
    lat.success && lng.success && isInKorea({ lat: lat.data, lng: lng.data })
      ? roundLatLng({ lat: lat.data, lng: lng.data })
      : null;
  const radius = radiusSchema.safeParse(search.radius);
  return {
    item,
    region: parseServiceRegion(search.region),
    center,
    radius: radius.success ? radius.data : defaultRadius(item !== null),
  };
}

/** 기본값은 빼서 짧은 쿼리 문자열을 만든다. 현재 위치는 사용자가 지역을 직접 고른 경우에만 담는다. */
export function buildMapQuery(params: MapParams) {
  const search = new URLSearchParams();
  if (params.item) search.set('item', params.item);
  const { region } = regionQuery(params.region);
  if (region) search.set('region', region);
  if (params.center) {
    const { lat, lng } = roundLatLng(params.center);
    search.set('lat', String(lat));
    search.set('lng', String(lng));
  }
  if (params.radius !== defaultRadius(params.item !== null)) {
    search.set('radius', String(params.radius));
  }
  return search.toString();
}
