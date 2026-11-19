import {
  regionQuery,
  type ServiceRegion,
} from '@/features/regions/service-region';

export type SuggestionId = 'category' | 'allCategories' | 'hospital' | 'item';

/** 결과가 마음에 들지 않을 때 이어 갈 검색. 같은 검색어와 지역을 유지한다. */
export function suggestionHref(
  id: SuggestionId,
  keyword: string,
  region: ServiceRegion,
) {
  const query =
    id === 'category' || id === 'allCategories'
      ? { category: 'all' }
      : id === 'hospital'
        ? { type: 'hospital', q: keyword }
        : { q: keyword };
  return {
    pathname: '/search',
    query: { ...query, ...regionQuery(region) },
  } as const;
}
