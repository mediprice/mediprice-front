import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

import { type LiveFeeResponse, liveFeeResponseSchema } from './schemas';

type LiveFeeApiOptions = {
  baseUrl: string;
  onSessionExpired?: () => void;
};

/** live-fee 경로가 아직 schema.d.ts에 없어 zod로 검증한다. 백엔드 배포 후 `pnpm api:generate`를 돌리면 apiClient + unwrap으로 바꾼다. */
export function createLiveFeeApi(options: LiveFeeApiOptions) {
  const request = createUntypedRequest(options);

  return {
    fetchLiveFee: (
      ykiho: string,
      npayCode: string,
      { signal }: { signal?: AbortSignal } = {},
    ): Promise<LiveFeeResponse> => {
      const query = new URLSearchParams({ ykiho, npayCode });
      return request.json(
        `/api/ai/live-fee?${query.toString()}`,
        liveFeeResponseSchema,
        { signal },
      );
    },
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const liveFeeApi = createLiveFeeApi({
  baseUrl: BFF_BASE,
  onSessionExpired: emitSessionExpired,
});
