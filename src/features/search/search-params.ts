import { z } from 'zod';

import {
  parseServiceRegion,
  type ServiceRegion,
} from '@/features/regions/service-region';

const KEYWORD_MAX_LENGTH = 100;

/** 같은 이름이 여러 번 오면(`?q=a&q=b`) 첫 값만 쓴다. */
const first = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (Array.isArray(value) ? value[0] : value), schema);

const searchParamsSchema = z.object({
  type: first(z.enum(['item', 'hospital'])).catch('item'),
  q: first(
    z.string().transform((value) => value.trim().slice(0, KEYWORD_MAX_LENGTH)),
  ).catch(''),
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
  | { mode: 'item'; keyword: string; region: ServiceRegion }
  | { mode: 'hospital'; keyword: string; region: ServiceRegion }
  | {
      mode: 'category';
      category: string | undefined;
      code: string | undefined;
      region: ServiceRegion;
    }
  | { mode: 'prompt'; type: 'item' | 'hospital'; region: ServiceRegion };

/** 검색어가 있으면 검색, 없고 분류(category·code)가 있으면 분류 탐색, 둘 다 없으면 입력 안내다. 잘못된 값은 기본값으로 바꾼다. */
export function parseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): SearchState {
  const { type, q, category, code } = searchParamsSchema.parse(raw);
  const region = parseServiceRegion(raw.region);

  if (q) return { mode: type, keyword: q, region };
  if (category || code) return { mode: 'category', category, code, region };
  return { mode: 'prompt', type, region };
}
