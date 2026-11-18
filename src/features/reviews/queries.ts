import {
  infiniteQueryOptions,
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';
import { shouldRetryQuery } from '@/lib/query-client';

import type { ReportForm, ReviewForm } from './schemas';

/** 비운 선택 칸은 보내지 않는다. 수정(PATCH)에서는 보내지 않은 값이 그대로 남는다. */
function toReviewBody(form: ReviewForm) {
  return {
    rating: form.rating,
    content: form.content,
    ...(form.visitedOn !== undefined && { visitedOn: form.visitedOn }),
    ...(form.paidAmount !== undefined && { paidAmount: form.paidAmount }),
  };
}

export type Review = components['schemas']['ReviewResponse'];
export type ReviewSort = 'latest' | 'rating';

const REVIEW_PAGE_SIZE = 5;
const MY_REVIEW_PAGE_SIZE = 10;
/** 백엔드가 한 페이지에 허용하는 최대 크기다. */
const MAX_PAGE_SIZE = 100;

export const reviewKeys = {
  all: ['reviews'] as const,
  hospital: (ykiho: string, sort: ReviewSort) =>
    [...reviewKeys.all, 'hospital', ykiho, sort] as const,
  mine: () => [...reviewKeys.all, 'mine'] as const,
  myList: () => [...reviewKeys.mine(), 'list'] as const,
  myReview: (reviewId: number) =>
    [...reviewKeys.mine(), 'detail', reviewId] as const,
};

function fetchMyReviews(page: number, size: number) {
  return unwrap(
    apiClient.GET('/api/users/me/reviews', {
      params: { query: { pageQuery: { page, size } } },
    }),
  );
}

/** 후기 한 건을 읽는 API가 없어 내 후기 목록을 넘기며 찾는다. 없으면 null이다. */
async function findMyReview(reviewId: number): Promise<Review | null> {
  for (let page = 0; ; page += 1) {
    const result = await fetchMyReviews(page, MAX_PAGE_SIZE);
    const found = result.content.find((review) => review.id === reviewId);
    if (found) return found;
    if (page + 1 >= result.totalPages) return null;
  }
}

/** 후기는 부가 정보라 5xx에도 한 번만 다시 시도해 빨리 실패를 보여 준다(기본 3번이면 스켈레톤이 6초 넘게 남는다). */
function retryOnce(failureCount: number, error: unknown) {
  return shouldRetryQuery(failureCount, error) && failureCount < 1;
}

export const reviewQueries = {
  hospital: (ykiho: string, sort: ReviewSort = 'latest') =>
    infiniteQueryOptions({
      queryKey: reviewKeys.hospital(ykiho, sort),
      queryFn: ({ pageParam }) =>
        unwrap(
          apiClient.GET('/api/hospitals/{ykiho}/reviews', {
            params: {
              path: { ykiho },
              query: {
                sortCondition: { sort },
                pageQuery: { page: pageParam, size: REVIEW_PAGE_SIZE },
              },
            },
          }),
        ),
      retry: retryOnce,
      initialPageParam: 0,
      getNextPageParam: (last) =>
        last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    }),

  mine: () =>
    infiniteQueryOptions({
      queryKey: reviewKeys.myList(),
      queryFn: ({ pageParam }) =>
        fetchMyReviews(pageParam, MY_REVIEW_PAGE_SIZE),
      retry: retryOnce,
      initialPageParam: 0,
      getNextPageParam: (last) =>
        last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    }),

  myReview: (reviewId: number) =>
    queryOptions({
      queryKey: reviewKeys.myReview(reviewId),
      queryFn: () => findMyReview(reviewId),
      retry: retryOnce,
    }),
};

/** 후기가 바뀌면 병원 목록·내 후기·평점 정렬이 모두 달라지므로 후기 캐시 전체를 다시 받는다. 뮤테이션이 다시 받기를 기다리지 않게 해서, 목록에서 카드가 사라지기 전에 화면의 성공 처리가 먼저 돈다. */
function invalidateReviews(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
}

/** 남의 후기(403)이거나 이미 지워진 후기(404)면 화면의 목록이 낡은 것이라 다시 받는다. */
function isStaleReviewError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'REVIEW_FORBIDDEN' || error.code === 'REVIEW_NOT_FOUND')
  );
}

export const reviewMutations = {
  create: (queryClient: QueryClient, ykiho: string) =>
    mutationOptions({
      mutationFn: (form: ReviewForm) =>
        unwrap(
          apiClient.POST('/api/hospitals/{ykiho}/reviews', {
            params: { path: { ykiho } },
            body: toReviewBody(form),
          }),
        ),
      onSuccess: () => invalidateReviews(queryClient),
    }),

  update: (queryClient: QueryClient, reviewId: number) =>
    mutationOptions({
      mutationFn: (form: ReviewForm) =>
        unwrap(
          apiClient.PATCH('/api/reviews/{reviewId}', {
            params: { path: { reviewId } },
            body: toReviewBody(form),
          }),
        ),
      onSuccess: (review) => {
        queryClient.setQueryData(reviewKeys.myReview(reviewId), review);
        invalidateReviews(queryClient);
      },
      onError: (error) => {
        if (isStaleReviewError(error)) invalidateReviews(queryClient);
      },
    }),

  remove: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (reviewId: number) =>
        unwrap(
          apiClient.DELETE('/api/reviews/{reviewId}', {
            params: { path: { reviewId } },
          }),
        ),
      onSuccess: (_, reviewId) => {
        queryClient.removeQueries({ queryKey: reviewKeys.myReview(reviewId) });
        invalidateReviews(queryClient);
      },
      onError: (error) => {
        if (isStaleReviewError(error)) invalidateReviews(queryClient);
      },
    }),

  report: (reviewId: number) =>
    mutationOptions({
      mutationFn: (form: ReportForm) =>
        unwrap(
          apiClient.POST('/api/reviews/{reviewId}/reports', {
            params: { path: { reviewId } },
            body: {
              reason: form.reason,
              ...(form.detail && { detail: form.detail }),
            },
          }),
        ),
    }),
};
