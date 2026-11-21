import type { z } from 'zod';

import { createApiFetch } from './client';
import { ApiError, NetworkError, toApiError } from './errors';

type Options = {
  baseUrl: string;
  onSessionExpired?: () => void;
};

/** 생성 타입(schema.d.ts)에 아직 없는 엔드포인트를 부른다(docs 7.2.1). 실패는 apiClient와 같은 ApiError·NetworkError이고, 응답은 zod로 검증한다. */
export function createUntypedRequest({ baseUrl, onSessionExpired }: Options) {
  const apiFetch = createApiFetch({ baseUrl, onSessionExpired });

  async function send(path: string, init: RequestInit) {
    let response: Response;
    try {
      response = await apiFetch(
        new Request(`${baseUrl}${path}`, {
          ...init,
          credentials: 'same-origin',
        }),
      );
    } catch (cause) {
      if (init.signal?.aborted) throw cause;
      throw new NetworkError(cause);
    }
    if (!response.ok) throw await toApiError(response);
    return response;
  }

  return {
    json: async <T>(
      path: string,
      schema: z.ZodType<T>,
      init: RequestInit = {},
    ): Promise<T> => {
      const response = await send(path, init);
      const parsed = schema.safeParse(await response.json().catch(() => null));
      if (!parsed.success) {
        throw new ApiError(
          response.status,
          'INVALID_RESPONSE',
          `Unexpected response from ${path}`,
        );
      }
      return parsed.data;
    },
    /** 본문 없는 응답(204)을 기대하는 요청. */
    empty: async (path: string, init: RequestInit = {}) => {
      await send(path, init);
    },
  };
}
