import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { components } from '@/lib/api/schema';
import { unwrap } from '@/lib/api/unwrap';

export type MedicalProfile = components['schemas']['MedicalProfileResponse'];
export type MedicalProfileRequest =
  components['schemas']['MedicalProfileRequest'];

export const medicalProfileKeys = {
  all: ['medicalProfile'] as const,
  mine: () => [...medicalProfileKeys.all, 'mine'] as const,
};

/** 저장한 적이 없으면(MEDICAL_PROFILE_NOT_FOUND) 에러가 아니라 null이다(docs 7.4). */
async function fetchMedicalProfile(): Promise<MedicalProfile | null> {
  try {
    return await unwrap(apiClient.GET('/api/users/me/medical-profile'));
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.code === 'MEDICAL_PROFILE_NOT_FOUND'
    ) {
      return null;
    }
    throw error;
  }
}

export const medicalProfileQueries = {
  mine: () =>
    queryOptions({
      queryKey: medicalProfileKeys.mine(),
      queryFn: fetchMedicalProfile,
    }),
};

export const medicalProfileMutations = {
  save: () =>
    mutationOptions({
      mutationFn: (body: MedicalProfileRequest) =>
        unwrap(apiClient.PUT('/api/users/me/medical-profile', { body })),
      onSuccess: (profile, _body, _result, { client }) => {
        client.setQueryData(medicalProfileKeys.mine(), profile);
      },
    }),
  remove: () =>
    mutationOptions({
      mutationFn: () =>
        unwrap(apiClient.DELETE('/api/users/me/medical-profile')),
      onSuccess: (_data, _variables, _result, { client }) => {
        client.setQueryData(medicalProfileKeys.mine(), null);
      },
    }),
};
