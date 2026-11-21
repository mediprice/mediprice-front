import { z } from 'zod';

import { CLAIM_PRIVACY_NOTICE_VERSION } from '@/config/legal';
import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

import type { ClaimForm } from './schemas';

/** 백엔드 feature/review-claims의 ClaimNoticeResponse·ReviewClaimResponse. 배포 후 `pnpm api:generate`를 돌리면 생성 타입과 apiClient로 바꾼다. */
const claimNoticeSchema = z.object({
  available: z.boolean(),
  privacyNoticeVersion: z.string().nullable(),
});

const claimReceiptSchema = z.object({
  id: z.number(),
  temporaryUntil: z.iso.datetime({ offset: true }),
});

export type ClaimNotice = z.infer<typeof claimNoticeSchema>;
export type ClaimReceipt = z.infer<typeof claimReceiptSchema>;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function claimPath(reviewId: number) {
  return `/api/reviews/${encodeURIComponent(reviewId)}/claims`;
}

/** 권리침해 신고 API가 아직 schema.d.ts에 없어 zod로 검증한다. 백엔드 배포 후 생성 클라이언트로 바꾼다. */
export function createClaimApi(
  request = createUntypedRequest({
    baseUrl: BFF_BASE,
    onSessionExpired: emitSessionExpired,
  }),
) {
  return {
    fetchNotice: () =>
      request.json('/api/claims/privacy-notice', claimNoticeSchema),
    /** 안내문 버전은 화면에 보여 준 문구의 버전(프론트 상수)을 보낸다. */
    submit: (reviewId: number, form: ClaimForm) =>
      request.json(claimPath(reviewId), claimReceiptSchema, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          claimantName: form.claimantName,
          claimantEmail: form.claimantEmail,
          claimantRole: form.claimantRole,
          reason: form.reason,
          description: form.description,
          agreement: true,
          privacyNoticeVersion: CLAIM_PRIVACY_NOTICE_VERSION,
        }),
      }),
    object: (reviewId: number, content: string) =>
      request.empty(`${claimPath(reviewId)}/objection`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ content }),
      }),
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const claimApi = createClaimApi();
