import { z } from 'zod';

const REGIONS = ['all', 'seoul', 'gyeonggi'] as const;
export type Region = (typeof REGIONS)[number];

const SIDO_CODE_BY_REGION = {
  seoul: '110000',
  gyeonggi: '310000',
} as const satisfies Record<Exclude<Region, 'all'>, string>;

const KEYWORD_MAX_LENGTH = 100;

/** 같은 이름이 여러 번 오면(`?q=a&q=b`) 첫 값만 쓴다. */
const first = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (Array.isArray(value) ? value[0] : value), schema);

const searchParamsSchema = z.object({
  type: first(z.enum(['item', 'hospital'])).catch('item'),
  q: first(
    z.string().transform((value) => value.trim().slice(0, KEYWORD_MAX_LENGTH)),
  ).catch(''),
  region: first(z.enum(REGIONS)).catch('all'),
  category: first(
    z
      .string()
      .regex(/^[a-z]{1,20}$/)
      .optional(),
  ).catch(undefined),
  code: first(
    z
      .string()
      .regex(/^[0-9A-Z]{5,10}$/)
      .optional(),
  ).catch(undefined),
});

export type SearchState =
  | { mode: 'item'; keyword: string; region: Region }
  | { mode: 'hospital'; keyword: string; region: Region }
  | {
      mode: 'category';
      category: string | undefined;
      code: string | undefined;
      region: Region;
    }
  | { mode: 'prompt'; type: 'item' | 'hospital'; region: Region };

/** 검색어가 있으면 검색, 없고 분류(category·code)가 있으면 분류 탐색, 둘 다 없으면 입력 안내다. 잘못된 값은 기본값으로 바꾼다. */
export function parseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SearchState {
  const { type, q, region, category, code } = searchParamsSchema.parse(raw);

  if (q) return { mode: type, keyword: q, region };
  if (category || code) return { mode: 'category', category, code, region };
  return { mode: 'prompt', type, region };
}

/** 가격 요약에 넘길 시도 코드. 전체는 조건 없이 조회한다. */
export function regionSidoCode(region: Region) {
  return region === 'all' ? undefined : SIDO_CODE_BY_REGION[region];
}

/** "전체 지역"은 다른 화면(항목 가격·홈)과 같게 시도 조건 없이 조회한다. 빈 배열이면 조건 없는 한 번의 조회다. */
export function regionSidoCodes(region: Region): string[] {
  return region === 'all' ? [] : [SIDO_CODE_BY_REGION[region]];
}

/** 화면 안 링크에 지역을 이어 붙인다. 기본값(all)은 URL을 짧게 두려고 뺀다. */
export function withRegion<T extends Record<string, string | undefined>>(
  query: T,
  region: Region,
) {
  return region === 'all' ? query : { ...query, region };
}
