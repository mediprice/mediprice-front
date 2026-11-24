import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { consentKeys } from '@/features/auth/queries';

import { medicalProfileApi, type MedicalProfileRequest } from './api';

export type { MedicalProfile, MedicalProfileRequest } from './api';

export const medicalProfileKeys = {
  all: ['medicalProfile'] as const,
  mine: () => [...medicalProfileKeys.all, 'mine'] as const,
};

export const medicalProfileQueries = {
  mine: () =>
    queryOptions({
      queryKey: medicalProfileKeys.mine(),
      queryFn: () => medicalProfileApi.fetch(),
    }),
};

export const medicalProfileMutations = {
  save: () =>
    mutationOptions({
      mutationFn: (body: MedicalProfileRequest) => medicalProfileApi.save(body),
      onSuccess: (profile, _body, _result, { client }) => {
        client.setQueryData(medicalProfileKeys.mine(), profile);
      },
    }),
  /** 동의를 철회하고 프로필을 지운다. 동의 현황 캐시도 다시 받게 한다. */
  withdraw: () =>
    mutationOptions({
      mutationFn: () => medicalProfileApi.withdrawConsent(),
      onSuccess: async (_data, _variables, _result, { client }) => {
        client.setQueryData(medicalProfileKeys.mine(), null);
        await client.invalidateQueries({ queryKey: consentKeys.all });
      },
    }),
};
