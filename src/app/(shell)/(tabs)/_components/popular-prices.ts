import 'server-only';

import { dehydrate } from '@tanstack/react-query';

import { POPULAR_ITEMS } from '@/features/npay/catalog';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import { HOME_REVALIDATE_SECONDS } from '@/server/api/home-data';
import { getRequestQueryClient } from '@/server/api/prefetch';
import { createPublicApi } from '@/server/api/public-client';

/** 실제 순위가 이만큼 모여야 순위로 보여 준다. 모자라면 고른 목록(POPULAR_ITEMS)을 순위 없이 보여 준다. */
export const POPULAR_ROW_COUNT = 6;

const homeApi = createPublicApi({ revalidate: HOME_REVALIDATE_SECONDS });

export function popularCodesOf(ranked: readonly { code: string }[]) {
  return ranked.length >= POPULAR_ROW_COUNT
    ? ranked.slice(0, POPULAR_ROW_COUNT).map(({ code }) => code)
    : POPULAR_ITEMS.map(({ code }) => code);
}

/** 인기 항목 카드의 서울·경기 요약을 카드와 같은 키로 채운다. 실패한 항목은 빠져 브라우저가 다시 읽는다. */
export async function prefetchPopularPrices(codes: readonly string[]) {
  const queryClient = getRequestQueryClient();
  await Promise.all(
    codes.map((code) =>
      queryClient.prefetchQuery(
        npayQueries.summaryIn(code, sidoCodesOf(DEFAULT_REGION), homeApi),
      ),
    ),
  );
  return dehydrate(queryClient);
}
