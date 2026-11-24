import { z } from 'zod';

import { readJson, removeItem, writeJson } from '@/lib/safe-storage';

const PREFIX = 'mediprice:review-draft:';

const draftSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().max(5000),
  visitedOn: z.string().max(20),
  paidAmount: z.string().max(20),
});

export type ReviewDraft = z.infer<typeof draftSchema>;

/** 새 후기는 병원마다, 고치는 후기는 후기마다 따로 둔다. */
export function reviewDraftKey(ykiho: string, reviewId?: number) {
  return reviewId != null ? `${PREFIX}${reviewId}` : `${PREFIX}new:${ykiho}`;
}

/** 이 탭에만 남는다(sessionStorage). 세션이 끝나 다시 로그인하고 돌아와도 쓰던 글을 잃지 않게 한다. */
export function readReviewDraft(key: string): ReviewDraft | null {
  return readJson('session', key, draftSchema);
}

export function writeReviewDraft(key: string, draft: ReviewDraft) {
  const isEmpty =
    draft.rating == null &&
    !draft.content.trim() &&
    !draft.visitedOn &&
    !draft.paidAmount;
  if (isEmpty) removeItem('session', key);
  else writeJson('session', key, draft);
}

export function clearReviewDraft(key: string) {
  removeItem('session', key);
}
