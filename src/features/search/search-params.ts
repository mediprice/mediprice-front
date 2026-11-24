import { z } from 'zod';

import {
  parseServiceRegion,
  type ServiceRegion,
} from '@/features/regions/service-region';
import { firstParam } from '@/lib/search-params';

const KEYWORD_MAX_LENGTH = 100;

const firstOf = <T extends z.ZodType>(schema: T) =>
  z.preprocess(firstParam, schema);

const searchParamsSchema = z.object({
  type: firstOf(z.enum(['item', 'hospital'])).catch('item'),
  q: firstOf(
    z.string().transform((value) => value.trim().slice(0, KEYWORD_MAX_LENGTH)),
  ).catch(''),
  category: firstOf(
    z
      .string()
      .regex(/^[a-z]{1,20}$/)
      .optional(),
  ).catch(undefined),
  code: firstOf(
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
