import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { type Review, reviewKeys, type ReviewPage } from './queries';

/** 후기 한 건을 읽는 공개 API가 없어, 병원 화면에서 이미 받은 목록에서 찾는다. 없으면 undefined다. */
export function findCachedHospitalReview(
  queryClient: QueryClient,
  ykiho: string,
  reviewId: number,
): Review | undefined {
  return queryClient
    .getQueriesData<InfiniteData<ReviewPage>>({
      queryKey: reviewKeys.hospitalAll(ykiho),
    })
    .flatMap(([, data]) => data?.pages ?? [])
    .flatMap((page) => page.content)
    .find((review) => review.id === reviewId);
}
