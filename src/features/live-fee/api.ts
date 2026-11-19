import { createApiFetch } from '@/lib/api/client';
import { ApiError, NetworkError, toApiError } from '@/lib/api/errors';
import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';

import { type LiveFeeResponse, liveFeeResponseSchema } from './schemas';

type LiveFeeApiOptions = {
  baseUrl: string;
  onSessionExpired?: () => void;
};

/** live-fee 경로가 아직 schema.d.ts에 없어 zod로 검증한다. 백엔드 배포 후 `pnpm api:generate`를 돌리면 apiClient + unwrap으로 바꾼다. */
export function createLiveFeeApi({
  baseUrl,
  onSessionExpired,
}: LiveFeeApiOptions) {
  const apiFetch = createApiFetch({ baseUrl, onSessionExpired });

  return {
    fetchLiveFee: async (
      ykiho: string,
      npayCode: string,
      { signal }: { signal?: AbortSignal } = {},
    ): Promise<LiveFeeResponse> => {
      const query = new URLSearchParams({ ykiho, npayCode });
      let response: Response;
      try {
        response = await apiFetch(
          new Request(`${baseUrl}/api/ai/live-fee?${query.toString()}`, {
            credentials: 'same-origin',
            signal,
          }),
        );
      } catch (cause) {
        if (signal?.aborted) throw cause;
        throw new NetworkError(cause);
      }
      if (!response.ok) throw await toApiError(response);
      const parsed = liveFeeResponseSchema.safeParse(
        await response.json().catch(() => null),
      );
      if (!parsed.success) {
        throw new ApiError(
          response.status,
          'INVALID_RESPONSE',
          'Unexpected live fee response',
        );
      }
      return parsed.data;
    },
  };
}

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const liveFeeApi = createLiveFeeApi({
  baseUrl: BFF_BASE,
  onSessionExpired: emitSessionExpired,
});
