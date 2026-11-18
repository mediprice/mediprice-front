import { z } from 'zod';

import type { NpayPriceCondition } from '@/features/npay/queries';

/** 홈·검색 링크와 같은 region 값(all|seoul|gyeonggi)을 쓴다. 코드는 백엔드 시도 코드다. */
const SIDO_CODE_BY_REGION = {
  seoul: '110000',
  gyeonggi: '310000',
} as const;

export const REGIONS = ['all', 'seoul', 'gyeonggi'] as const;
export const SORTS = ['price_asc', 'price_desc'] as const;

export type PriceRegion = (typeof REGIONS)[number];
export type PriceSort = (typeof SORTS)[number];

export type PriceFilters = {
  region: PriceRegion;
  sggu?: string;
  institution?: string;
  sort: PriceSort;
};

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const searchSchema = z.object({
  region: z.preprocess(first, z.enum(REGIONS).catch('all')),
  sggu: z.preprocess(
    first,
    z
      .string()
      .regex(/^\d{6}$/)
      .optional()
      .catch(undefined),
  ),
  institution: z.preprocess(
    first,
    z
      .string()
      .regex(/^[0-9A-Z]{2}$/)
      .optional()
      .catch(undefined),
  ),
  sort: z.preprocess(first, z.enum(SORTS).catch('price_asc')),
});

export function sidoCodeOf(region: PriceRegion) {
  return region === 'all' ? undefined : SIDO_CODE_BY_REGION[region];
}

/** 시군구 코드 앞 두 자리는 시도 코드와 같다. 다른 시도의 시군구나 지역 없이 온 시군구는 버린다. */
function belongsTo(sggu: string, region: PriceRegion) {
  const sido = sidoCodeOf(region);
  return sido !== undefined && sggu.slice(0, 2) === sido.slice(0, 2);
}

/** URL 검색 파라미터를 검증해 필터로 바꾼다. 잘못된 값은 기본값으로 돌린다. */
export function parsePriceFilters(
  search: Record<string, string | string[] | undefined>,
): PriceFilters {
  const parsed = searchSchema.parse(search);
  const sggu =
    parsed.sggu && belongsTo(parsed.sggu, parsed.region)
      ? parsed.sggu
      : undefined;
  return {
    region: parsed.region,
    sort: parsed.sort,
    ...(sggu && { sggu }),
    ...(parsed.institution && { institution: parsed.institution }),
  };
}

/** 기본값은 빼서 공유하기 좋은 짧은 쿼리 문자열을 만든다. */
export function buildPriceFiltersQuery(filters: PriceFilters) {
  const search = new URLSearchParams();
  if (filters.region !== 'all') search.set('region', filters.region);
  if (filters.sggu && belongsTo(filters.sggu, filters.region)) {
    search.set('sggu', filters.sggu);
  }
  if (filters.institution) search.set('institution', filters.institution);
  if (filters.sort !== 'price_asc') search.set('sort', filters.sort);
  return search.toString();
}

export function toPriceCondition(filters: PriceFilters): NpayPriceCondition {
  const sidoCode = sidoCodeOf(filters.region);
  return {
    ...(sidoCode && { sidoCode }),
    ...(sidoCode && filters.sggu && { sgguCode: filters.sggu }),
    ...(filters.institution && { institutionCode: filters.institution }),
  };
}

/** 정렬을 뺀 조건(지역·시군구·종별) 수. 필터 버튼의 숫자에 쓴다. */
export function countActiveFilters(filters: PriceFilters) {
  return [
    filters.region !== 'all',
    Boolean(filters.sggu),
    Boolean(filters.institution),
  ].filter(Boolean).length;
}

/** 정렬은 남기고 조건만 비운다. */
export function clearConditions(filters: PriceFilters): PriceFilters {
  return { region: 'all', sort: filters.sort };
}

export function withRegion(
  filters: PriceFilters,
  region: PriceRegion,
): PriceFilters {
  if (region === filters.region) return filters;
  const { sggu: _sggu, ...rest } = filters;
  return { ...rest, region };
}
