import { z } from 'zod/mini';

import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

/** 백엔드 feature/privacy-consent의 ConsentStateResponse. 배포 후 `pnpm api:generate`를 돌리면 생성 타입과 apiClient로 바꾼다. */
const consentStateSchema = z.object({
  type: z.string(),
  required: z.boolean(),
  currentVersion: z.string(),
  agreed: z.boolean(),
  agreedVersion: z.nullable(z.string()),
  agreedAt: z.nullable(z.string()),
  withdrawnAt: z.nullable(z.string()),
  reconsentRequired: z.boolean(),
});

const consentStatusSchema = z.object({
  requiredConsentsMissing: z.boolean(),
  consents: z.array(consentStateSchema),
});

export type ConsentType =
  'TERMS' | 'PRIVACY' | 'AGE_14' | 'MEDICAL_PROFILE' | 'LOCATION';
export type ConsentStatus = z.infer<typeof consentStatusSchema>;
export type ConsentDecision = {
  type: ConsentType;
  version: string;
  agreed: boolean;
};

/** 동의 API가 아직 schema.d.ts에 없어 zod로 검증한다. 백엔드 배포 후 생성 클라이언트로 바꾼다. */
export function createConsentApi(
  request = createUntypedRequest({
    baseUrl: BFF_BASE,
    onSessionExpired: emitSessionExpired,
  }),
) {
  return {
    fetchStatus: () =>
      request.json('/api/users/me/consents', consentStatusSchema),
    save: (consents: ConsentDecision[]) =>
      request.json('/api/users/me/consents', consentStatusSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consents }),
      }),
    /** 선택 동의를 철회한다(필수 동의는 400). */
    withdraw: (type: ConsentType) =>
      request.empty(`/api/users/me/consents/${type}`, { method: 'DELETE' }),
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const consentApi = createConsentApi();
