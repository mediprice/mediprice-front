import { z } from 'zod';

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
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeReviewDraft(key: string, draft: ReviewDraft) {
  try {
    const isEmpty =
      draft.rating == null &&
      !draft.content.trim() &&
      !draft.visitedOn &&
      !draft.paidAmount;
    if (isEmpty) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /** 저장소를 쓸 수 없으면(사생활 보호 모드 등) 초안 없이 쓴다. */
  }
}

export function clearReviewDraft(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /** 위와 같다. */
  }
}
