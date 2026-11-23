import { z } from 'zod/mini';

import { BFF_BASE } from '@/lib/api/paths';
import { serializeQuery } from '@/lib/api/query';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

const priceSummarySchema = z.object({
  npayCode: z.string(),
  minPrice: z.nullable(z.number()),
  maxPrice: z.nullable(z.number()),
  avgPrice: z.nullable(z.number()),
  priceCount: z.number(),
  hospitalCount: z.number(),
});

const nullableText = z.nullable(z.string());

/** priceSummary 키가 없으면 이전 백엔드다. null(파라미터를 무시한 경우 등)도 요약이 없는 것으로 보고 항목마다 읽는다. */
const itemPageSchema = z.object({
  content: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      mdivCode: nullableText,
      mdivName: nullableText,
      sdivCode: nullableText,
      sdivName: nullableText,
      priceSummary: z.optional(z.nullable(priceSummarySchema)),
    }),
  ),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type ItemListPage = z.infer<typeof itemPageSchema>;

export type ItemListQuery = {
  keyword?: string;
  categoryCode?: string;
  /** 요약과 "가격 있음"을 판단할 시도. 결과를 좁히지 않는다. 비어 있으면 전국이다. */
  sidoCodes: readonly string[];
  page: number;
  size: number;
};

/**
 * 항목 목록에 지역 가격 요약을 함께 받고 가격 있는 항목을 먼저 받는다(백엔드 #24). 생성 타입에 아직 없어 zod로 검증한다.
 * 배포 후 `pnpm api:generate`를 돌리면 생성 클라이언트로 바꾼다. 이전 백엔드는 모르는 파라미터를 무시하고 예전 응답을 준다.
 */
export function createSearchApi(
  request = createUntypedRequest({
    baseUrl: BFF_BASE,
    onSessionExpired: emitSessionExpired,
  }),
) {
  return {
    fetchItems: ({
      keyword,
      categoryCode,
      sidoCodes,
      page,
      size,
    }: ItemListQuery) =>
      request.json(
        `/api/npay-items?${serializeQuery({
          condition: { keyword, categoryCode },
          priceCondition: {
            sidoCode: sidoCodes,
            withPriceSummary: true,
            pricedFirst: true,
          },
          pageQuery: { page, size },
        })}`,
        itemPageSchema,
      ),
  };
}

export const searchApi = createSearchApi();
