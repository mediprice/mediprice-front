import {
  mutationOptions,
  type QueryClient,
  queryOptions,
} from '@tanstack/react-query';

import { CLAIM_PRIVACY_NOTICE_VERSION } from '@/config/legal';
import { reviewKeys } from '@/features/reviews/queries';
import { ApiError, isUnsupportedEndpoint } from '@/lib/api/errors';

import { claimApi, type ClaimNotice } from './api';
import type { ClaimForm, ObjectionForm } from './schemas';

export const claimKeys = {
  all: ['claims'] as const,
  notice: () => [...claimKeys.all, 'notice'] as const,
};

/** unsupported: 서버에 기능이 없음(입구를 숨김), closed: 접수 중단이나 안내문 버전 불일치(양식을 막음), open: 접수 가능. */
export type ClaimNoticeState = 'unsupported' | 'closed' | 'open';

export function claimNoticeState(notice: ClaimNotice | null): ClaimNoticeState {
  if (notice === null) return 'unsupported';
  return notice.available &&
    notice.privacyNoticeVersion === CLAIM_PRIVACY_NOTICE_VERSION
    ? 'open'
    : 'closed';
}

export const claimQueries = {
  /** 접수 가능 여부. 서버에 기능이 없으면 null이다. 공개 경로인데 401이면 배포된 백엔드가 경로를 몰라 인증을 요구한 것이다. */
  notice: () =>
    queryOptions({
      queryKey: claimKeys.notice(),
      queryFn: async (): Promise<ClaimNotice | null> => {
        try {
          return await claimApi.fetchNotice();
        } catch (error) {
          if (
            isUnsupportedEndpoint(error) ||
            (error instanceof ApiError && error.status === 401)
          ) {
            return null;
          }
          throw error;
        }
      },
      staleTime: 5 * 60 * 1000,
    }),
};

/** 접수를 막는 응답이면 안내 상태가 바뀐 것이라 다시 받는다. */
function isNoticeChanged(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'CLAIM_NOTICE_VERSION_OUTDATED' ||
      error.code === 'CLAIM_UNAVAILABLE')
  );
}

/** 처리 중인 신고가 없거나(404) 이미 요청했으면(409) 내 후기 목록이 낡은 것이다. */
function isStaleMeasureError(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.code === 'ACTIVE_CLAIM_NOT_FOUND' ||
      error.code === 'CLAIM_OBJECTION_ALREADY_SUBMITTED' ||
      error.code === 'REVIEW_NOT_FOUND')
  );
}

export const claimMutations = {
  /** 접수하면 후기가 바로 가려지므로 병원 후기 목록을 다시 받는다. */
  submit: (queryClient: QueryClient, reviewId: number) =>
    mutationOptions({
      mutationFn: (form: ClaimForm) => claimApi.submit(reviewId, form),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      },
      onError: (error) => {
        if (isNoticeChanged(error)) {
          void queryClient.invalidateQueries({ queryKey: claimKeys.notice() });
        }
      },
    }),

  object: (queryClient: QueryClient, reviewId: number) =>
    mutationOptions({
      mutationFn: (form: ObjectionForm) =>
        claimApi.object(reviewId, form.content),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: reviewKeys.mine() });
      },
      onError: (error) => {
        if (isStaleMeasureError(error)) {
          void queryClient.invalidateQueries({ queryKey: reviewKeys.mine() });
        }
      },
    }),
};
