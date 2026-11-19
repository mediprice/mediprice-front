import { z } from 'zod';

import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

const CLAIM_STATUSES = ['PENDING', 'EXPIRED_PENDING', 'RESOLVED'] as const;
export const CLAIM_ACTIONS = [
  'RESTORE',
  'KEEP_HIDDEN',
  'DELETE_REVIEW',
] as const;
export const CLAIM_NOTE_MAX = 1000;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type ClaimAction = (typeof CLAIM_ACTIONS)[number];

const dateTime = z.iso.datetime({ offset: true });

/** 백엔드 feature/review-claims의 AdminClaimResponse. 배포 후 `pnpm api:generate`를 돌리면 생성 타입과 apiClient로 바꾼다. 사유·구분은 새 값이 생겨도 화면이 깨지지 않게 문자열로 받는다. */
const adminClaimSchema = z.object({
  id: z.number(),
  reviewId: z.number().nullable(),
  claimantUserId: z.number().nullable(),
  claimantName: z.string(),
  claimantEmail: z.string(),
  claimantRole: z.string(),
  reason: z.string(),
  description: z.string(),
  privacyNoticeVersion: z.string(),
  status: z.enum(CLAIM_STATUSES),
  temporaryUntil: dateTime,
  objection: z.string().nullable(),
  objectedAt: dateTime.nullable(),
  action: z.enum(CLAIM_ACTIONS).nullable(),
  resolutionNote: z.string().nullable(),
  resolvedBy: z.number().nullable(),
  resolvedAt: dateTime.nullable(),
  claimantNotifiedAt: dateTime.nullable(),
  authorNotifiedAt: dateTime.nullable(),
  createdAt: dateTime,
  review: z
    .object({
      id: z.number(),
      ykiho: z.string(),
      authorId: z.number().nullable(),
      rating: z.number(),
      content: z.string(),
      status: z.string(),
      createdAt: dateTime,
    })
    .nullable(),
});

const claimPageSchema = z.object({
  content: z.array(adminClaimSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export type AdminClaim = z.infer<typeof adminClaimSchema>;

export type ClaimNotification = {
  claimantNotified?: boolean;
  authorNotified?: boolean;
};

export type ClaimResolution = ClaimNotification & {
  action: ClaimAction;
  note: string;
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function claimPath(claimId: number) {
  return `/api/admin/claims/${encodeURIComponent(claimId)}`;
}

/** 관리자 권리침해 신고 API가 아직 schema.d.ts에 없어 zod로 검증한다. 백엔드 배포 후 생성 클라이언트로 바꾼다. */
export function createAdminClaimApi(
  request = createUntypedRequest({
    baseUrl: BFF_BASE,
    onSessionExpired: emitSessionExpired,
  }),
) {
  return {
    /** page는 백엔드처럼 0부터 센다. 먼저 들어온 신고부터 온다. */
    list: (query: { status: ClaimStatus; page: number; size: number }) => {
      const search = new URLSearchParams({
        status: query.status,
        page: String(query.page),
        size: String(query.size),
      });
      return request.json(`/api/admin/claims?${search}`, claimPageSchema);
    },
    detail: (claimId: number) =>
      request.json(claimPath(claimId), adminClaimSchema),
    resolve: (claimId: number, body: ClaimResolution) =>
      request.json(claimPath(claimId), adminClaimSchema, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      }),
    /** true로 보낸 쪽만 지금 시각으로 한 번 기록된다. 지울 수 없다. */
    markNotified: (claimId: number, body: ClaimNotification) =>
      request.json(`${claimPath(claimId)}/notifications`, adminClaimSchema, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      }),
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const adminClaimApi = createAdminClaimApi();
