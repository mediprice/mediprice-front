import { BFF_BASE } from '@/lib/api/paths';
import { emitSessionExpired } from '@/lib/api/session-events';
import { createUntypedRequest } from '@/lib/api/untyped-request';

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
export function createAiApi(options: AiApiOptions) {
  const request = createUntypedRequest(options);

  return {
    sendTurn: (
      input: string,
      state: TurnState | null,
      { signal }: RequestOptions = {},
    ): Promise<TurnResponse> =>
      request.json('/api/ai/chat/turn', turnResponseSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, state }),
        signal,
      }),

    transcribe: async (audio: Blob, { signal }: RequestOptions = {}) =>
      (
        await request.json(
          '/api/ai/speech/transcribe',
          transcribeResponseSchema,
          {
            method: 'POST',
            headers: { 'Content-Type': audio.type || 'audio/webm' },
            body: audio,
            signal,
          },
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
