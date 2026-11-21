import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';
import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

const PROFILE_PATH = '/api/users/me/medical-profile';
const CONSENT_PATH = '/api/users/me/consents/MEDICAL_PROFILE';

/**
 * 백엔드 feature/privacy-consent의 MedicalProfileResponse(consentVersion·consentedAt 추가). 배포 후 `pnpm api:generate`를 돌리면
 * 생성 타입과 apiClient로 바꾼다. 아직 배포 전인 백엔드에는 두 값이 없어(undefined) 옵션으로 둔다.
 */
const medicalProfileSchema = z.object({
  birthYear: z.number().nullable(),
  gender: z.string().nullable(),
  chronicConditions: z.string().nullable(),
  medications: z.string().nullable(),
  allergies: z.string().nullable(),
  note: z.string().nullable(),
  updatedAt: z.string(),
  consentVersion: z.string().nullable().optional(),
  consentedAt: z.string().nullable().optional(),
});

export type MedicalProfile = z.infer<typeof medicalProfileSchema>;

/** PUT 본문. consentVersion은 사용자가 체크한 건강 정보 동의 문서의 버전이다(백엔드 필수). */
export type MedicalProfileRequest = {
  birthYear?: number;
  gender?: string;
  chronicConditions?: string;
  medications?: string;
  allergies?: string;
  note?: string;
  consentVersion: string;
};

/** 경로 자체가 없는(아직 배포 전) 백엔드의 404. MEDICAL_PROFILE_NOT_FOUND 같은 업무 404와 구분한다. */
function isMissingEndpoint(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    (error.code === 'RESOURCE_NOT_FOUND' || error.code === 'NOT_FOUND')
  );
}

function createMedicalProfileApi(
  request = createUntypedRequest({
    baseUrl: BFF_BASE,
    onSessionExpired: emitSessionExpired,
  }),
) {
  return {
    /** 저장한 적이 없으면(MEDICAL_PROFILE_NOT_FOUND) 에러가 아니라 null이다(docs 7.4). */
    fetch: async (): Promise<MedicalProfile | null> => {
      try {
        return await request.json(PROFILE_PATH, medicalProfileSchema);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === 'MEDICAL_PROFILE_NOT_FOUND'
        ) {
          return null;
        }
        throw error;
      }
    },
    save: (body: MedicalProfileRequest) =>
      request.json(PROFILE_PATH, medicalProfileSchema, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    /** 건강 정보 동의를 철회하면 백엔드가 프로필도 함께 지운다. 동의 API가 없는 백엔드에서는 프로필 삭제가 같은 결과다. */
    withdrawConsent: async () => {
      try {
        await request.empty(CONSENT_PATH, { method: 'DELETE' });
      } catch (error) {
        if (!isMissingEndpoint(error)) throw error;
        await request
          .empty(PROFILE_PATH, { method: 'DELETE' })
          .catch((fallbackError: unknown) => {
            if (
              fallbackError instanceof ApiError &&
              fallbackError.code === 'MEDICAL_PROFILE_NOT_FOUND'
            ) {
              return;
            }
            throw fallbackError;
          });
      }
    },
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const medicalProfileApi = createMedicalProfileApi();
