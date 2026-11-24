import { mutationOptions } from '@tanstack/react-query';

import { liveFeeApi } from './api';

export const liveFeeMutations = {
  check: (ykiho: string, npayCode: string) =>
    mutationOptions({
      mutationFn: () => liveFeeApi.fetchLiveFee(ykiho, npayCode),
    }),
};
