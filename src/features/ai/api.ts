import type { z } from 'zod';

import { createApiFetch } from '@/lib/api/client';
import { ApiError, NetworkError, toApiError } from '@/lib/api/errors';
import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';

import {
  transcribeResponseSchema,
  type TurnResponse,
  turnResponseSchema,
  type TurnState,
} from './schemas';

type AiApiOptions = {
  baseUrl: string;
  onSessionExpired?: () => void;
};

type RequestOptions = { signal?: AbortSignal };

/** AI 경로가 아직 schema.d.ts에 없어 zod로 검증한다. 백엔드 배포 후 `pnpm api:generate`를 돌리면 apiClient + unwrap으로 바꾼다. */
export function createAiApi({ baseUrl, onSessionExpired }: AiApiOptions) {
  const apiFetch = createApiFetch({ baseUrl, onSessionExpired });

  async function call<T>(
    path: string,
    init: RequestInit,
    schema: z.ZodType<T>,
  ): Promise<T> {
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
    const parsed = schema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(
        response.status,
        'INVALID_RESPONSE',
        'Unexpected AI response',
      );
    }
    return parsed.data;
  }

  return {
    sendTurn: (
      input: string,
      state: TurnState | null,
      { signal }: RequestOptions = {},
    ): Promise<TurnResponse> =>
      call(
        '/api/ai/chat/turn',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, state }),
          signal,
        },
        turnResponseSchema,
      ),

    transcribe: async (audio: Blob, { signal }: RequestOptions = {}) =>
      (
        await call(
          '/api/ai/speech/transcribe',
          {
            method: 'POST',
            headers: { 'Content-Type': audio.type || 'audio/webm' },
            body: audio,
            signal,
          },
          transcribeResponseSchema,
        )
      ).text,
  };
}

export type AiApi = ReturnType<typeof createAiApi>;

/** 브라우저 전용이다(상대 경로 `/bff`를 쓴다). */
export const aiApi = createAiApi({
  baseUrl: BFF_BASE,
  onSessionExpired: emitSessionExpired,
});
