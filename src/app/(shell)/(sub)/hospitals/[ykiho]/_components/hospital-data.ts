import 'server-only';

import { dehydrate } from '@tanstack/react-query';

import { hospitalQueries } from '@/features/hospitals/queries';
import { npayQueries } from '@/features/npay/queries';
import {
  type ServiceRegion,
  sidoCodesOf,
} from '@/features/regions/service-region';
import { getRequestQueryClient, loadOrNotFound } from '@/server/api/prefetch';
import { publicApi } from '@/server/api/public-client';

/** 없는 병원이면 404다. 백엔드가 늦거나 실패하면 null이라 브라우저가 다시 읽는다. */
export function loadHospital(ykiho: string) {
  return loadOrNotFound(() =>
    getRequestQueryClient().fetchQuery(
      hospitalQueries.detail(ykiho, publicApi),
    ),
  );
}

/** 항목에서 들어왔을 때 선택 카드가 쓰는 쿼리(항목 이름, 이 병원의 세부 가격, 추이, 지역 요약). */
async function prefetchSelectedItem(
  ykiho: string,
  item: string,
  region: ServiceRegion,
) {
  const queryClient = getRequestQueryClient();
  const loadPrices = async () => {
    const detail = await queryClient
      .fetchQuery(npayQueries.detail(item, publicApi))
      .catch(() => null);
    if (!detail) return;
    await queryClient.prefetchQuery(
      hospitalQueries.itemPrices(ykiho, item, detail.name, publicApi),
    );
  };
  await Promise.all([
    loadPrices(),
    queryClient.prefetchQuery(
      hospitalQueries.priceHistory(ykiho, { npayCode: item }, publicApi),
    ),
    queryClient.prefetchQuery(
      npayQueries.summaryIn(item, sidoCodesOf(region), publicApi),
    ),
  ]);
}

/** 브라우저가 첫 화면에서 쓰는 쿼리를 같은 키로 채운다. 선택 카드 조회는 404 판정에 필요한 병원 상세와 함께 달려 기다림이 거의 늘지 않는다. 실패한 쿼리는 빠져 브라우저가 다시 읽는다. */
export async function prefetchHospitalPage(
  ykiho: string,
  selected: { item: string; region: ServiceRegion } | null,
) {
  const queryClient = getRequestQueryClient();
  await Promise.all([
    loadHospital(ykiho),
    queryClient.prefetchInfiniteQuery(
      hospitalQueries.priceList(ykiho, {}, publicApi),
    ),
    selected && prefetchSelectedItem(ykiho, selected.item, selected.region),
  ]);
  return dehydrate(queryClient);
}
