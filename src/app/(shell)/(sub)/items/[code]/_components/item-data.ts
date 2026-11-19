import 'server-only';

import { dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';

import { parseItemParam } from '@/features/hospitals/detail-links';
import { comparableBand } from '@/features/npay/average-verdict';
import {
  buildPriceFiltersQuery,
  type PriceFilters,
  toPriceConditions,
} from '@/features/npay/price-filters';
import { npayQueries } from '@/features/npay/queries';
import { DEFAULT_REGION, sidoCodesOf } from '@/features/regions/service-region';
import { getRequestQueryClient, loadOrNotFound } from '@/server/api/prefetch';
import { publicApi } from '@/server/api/public-client';

/** 형식이 맞지 않는 코드는 백엔드에 묻지 않고 404다. 백엔드가 늦거나 실패하면 null이라 브라우저가 다시 읽는다. */
export function loadItem(code: string) {
  if (!parseItemParam(code)) notFound();
  return loadOrNotFound(() =>
    getRequestQueryClient().fetchQuery(npayQueries.detail(code, publicApi)),
  );
}

/** 제목·설명과 기본 화면이 함께 쓰는 서울·경기 요약. 실패하면 설명에서 평균만 뺀다. */
export function loadDefaultSummary(code: string) {
  return getRequestQueryClient()
    .fetchQuery(
      npayQueries.summaryIn(code, sidoCodesOf(DEFAULT_REGION), publicApi),
    )
    .catch(() => null);
}

/**
 * 브라우저가 첫 화면에서 쓰는 쿼리를 같은 키로 채운다. 상세(404 판정)와 서울·경기 요약(제목·설명)은 늘 읽는다.
 * 가격 목록은 canonical인 기본 조건(쿼리 없는 주소)에서만 읽는다. 필터를 바꾸는 이동이 느린 조회(전국 등)를 기다리느라
 * 멈추지 않고 예전처럼 뼈대를 보여 준 뒤 채우게 한다. 목록은 요약의 평균으로 정한 가격 범위로 읽으므로 요약 다음에 읽고,
 * 요약이 실패하면 목록도 브라우저에 맡긴다. 실패한 쿼리는 빠져 브라우저가 다시 읽는다.
 */
export async function prefetchItemPage(code: string, filters: PriceFilters) {
  const queryClient = getRequestQueryClient();
  const isCanonical = buildPriceFiltersQuery(filters) === '';
  const prefetchList = async () => {
    const summary = await loadDefaultSummary(code);
    const band = comparableBand(summary?.avgPrice);
    if (!isCanonical || !band) return;
    const conditions = toPriceConditions(filters, band);
    await Promise.all([
      queryClient.prefetchInfiniteQuery(
        npayQueries.priceList(
          code,
          { conditions, sort: filters.sort },
          publicApi,
        ),
      ),
      queryClient.prefetchQuery(
        npayQueries.summaryOf(code, conditions, publicApi),
      ),
    ]);
  };
  await Promise.all([loadItem(code), prefetchList()]);
  return dehydrate(queryClient);
}
