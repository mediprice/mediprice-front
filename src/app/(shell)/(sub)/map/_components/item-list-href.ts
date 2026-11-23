import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';

/** 지도로 들어온 항목 가격 화면(S-06)으로 돌아가는 링크. 넘겨받은 필터가 있으면 그대로, 없으면 지역만 유지한다. */
export function itemListHref(
  item: string,
  region: ServiceRegion,
  back: string | null = null,
) {
  const query = back ?? new URLSearchParams(regionQuery(region)).toString();
  const path = `/items/${encodeURIComponent(item)}` as const;
  return query ? (`${path}?${query}` as const) : path;
}
