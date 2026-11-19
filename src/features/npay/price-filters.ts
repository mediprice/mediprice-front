import { z } from 'zod';

import {
  DEFAULT_REGION,
  parseServiceRegion,
  regionQuery,
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';

import type { PriceBand } from './average-verdict';
import type { NpayPriceCondition } from './queries';

export const SORTS = ['price_asc', 'price_desc'] as const;
export type PriceSort = (typeof SORTS)[number];

export const SORT_LABEL_KEY = {
  price_asc: 'priceAsc',
  price_desc: 'priceDesc',
} as const satisfies Record<PriceSort, string>;

export type PriceFilters = {
  region: ServiceRegion;
  sggu?: string;
  institution?: string;
  sort: PriceSort;
  /** 'all'이면 평균과 견주기 어려운 가격(시간·횟수 구성이 다른 세부 항목)까지 모두 보여 준다. 기본은 견줄 수 있는 가격만이다. */
  prices?: 'all';
};

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const searchSchema = z.object({
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
  prices: z.preprocess(first, z.literal('all').optional().catch(undefined)),
});

/** 시군구는 서울·경기 하나를 골랐을 때만 쓴다. 시군구 코드 앞 두 자리가 시도 코드와 같다. */
export function sgguSidoOf(region: ServiceRegion) {
  return region === 'seoul' || region === 'gyeonggi'
    ? sidoCodesOf(region)[0]
    : undefined;
}

function belongsTo(sggu: string, region: ServiceRegion) {
  const sido = sgguSidoOf(region);
  return sido !== undefined && sggu.slice(0, 2) === sido.slice(0, 2);
}

/** URL 검색 파라미터를 검증해 필터로 바꾼다. 잘못된 값은 기본값으로 돌린다. */
export function parsePriceFilters(
  search: Record<string, string | string[] | undefined>,
): PriceFilters {
  const region = parseServiceRegion(search.region);
  const parsed = searchSchema.parse(search);
  const sggu =
    parsed.sggu && belongsTo(parsed.sggu, region) ? parsed.sggu : undefined;
  return {
    region,
    sort: parsed.sort,
    ...(sggu && { sggu }),
    ...(parsed.institution && { institution: parsed.institution }),
    ...(parsed.prices && { prices: parsed.prices }),
  };
}

/** 기본값은 빼서 공유하기 좋은 짧은 쿼리 문자열을 만든다. */
export function buildPriceFiltersQuery(filters: PriceFilters) {
  const search = new URLSearchParams(regionQuery(filters.region));
  if (filters.sggu && belongsTo(filters.sggu, filters.region)) {
    search.set('sggu', filters.sggu);
  }
  if (filters.institution) search.set('institution', filters.institution);
  if (filters.sort !== 'price_asc') search.set('sort', filters.sort);
  if (filters.prices) search.set('prices', filters.prices);
  return search.toString();
}

/** 백엔드는 시도 하나만 받으므로 서울·경기는 조건 두 개가 된다. 빈 배열은 전국이다. band를 주면 그 가격 범위의 행만 받는다. */
export function toPriceConditions(
  filters: PriceFilters,
  band?: PriceBand | null,
): NpayPriceCondition[] {
  const extra = {
    ...(filters.sggu &&
      belongsTo(filters.sggu, filters.region) && { sgguCode: filters.sggu }),
    ...(filters.institution && { institutionCode: filters.institution }),
    ...band,
  };
  const sidoCodes = sidoCodesOf(filters.region);
  if (sidoCodes.length === 0) {
    return Object.keys(extra).length > 0 ? [extra] : [];
  }
  return sidoCodes.map((sidoCode) => ({ sidoCode, ...extra }));
}

/** 정렬을 뺀 조건(지역·시군구·종별) 수. 필터 버튼의 숫자에 쓴다. */
export function countActiveFilters(filters: PriceFilters) {
  return [
    filters.region !== DEFAULT_REGION,
    Boolean(filters.sggu),
    Boolean(filters.institution),
  ].filter(Boolean).length;
}

/** 정렬은 남기고 조건만 비운다. 모든 가격 보기도 기본(견줄 수 있는 가격만)으로 돌린다. */
export function clearConditions(filters: PriceFilters): PriceFilters {
  return { region: DEFAULT_REGION, sort: filters.sort };
}

export function withRegion(
  filters: PriceFilters,
  region: ServiceRegion,
): PriceFilters {
  if (region === filters.region) return filters;
  const { sggu: _sggu, ...rest } = filters;
  return { ...rest, region };
}
