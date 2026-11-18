import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ApiError, NetworkError } from '@/lib/api/errors';
import { server } from '@/test/server';

import { classifyTranscribeError, classifyTurnError } from './ai-errors';
import { createAiApi } from './api';

const BASE = 'http://app.test/bff';
const TURN = `${BASE}/api/ai/chat/turn`;
const TRANSCRIBE = `${BASE}/api/ai/speech/transcribe`;
const REFRESH = `${BASE}/session/refresh`;

const reply = {
  state: { phase: 'asking', user_turns: 1 },
  kind: 'question',
  reply: '어느 부위가 가장 불편하세요?',
  questions: [
    { about: '부위', text: '어느 부위인가요?', options: ['허리', '모름'] },
  ],
  items: [],
  emergencyBanner: false,
  remainingTurns: 5,
};

const errorBody = (code: string, status: number) =>
  HttpResponse.json({ code, message: '백엔드 문구', errors: [] }, { status });

function setup() {
  const onSessionExpired = vi.fn();
  return {
    api: createAiApi({ baseUrl: BASE, onSessionExpired }),
    onSessionExpired,
  };
}

describe('sendTurn', () => {
  it('입력과 상태를 JSON으로 보내고 검증한 응답을 돌려준다', async () => {
    let body: unknown;
    server.use(
      http.post(TURN, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(reply);
      }),
    );

    const result = await setup().api.sendTurn('허리가 아파요', {
      phase: 'collecting',
    });

    expect(body).toEqual({
      input: '허리가 아파요',
      state: { phase: 'collecting' },
    });
    expect(result).toEqual(reply);
  });

  it('첫 턴은 상태를 null로 보낸다', async () => {
    let body: unknown;
    server.use(
      http.post(TURN, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(reply);
      }),
    );

    await setup().api.sendTurn('안녕하세요', null);

    expect(body).toEqual({ input: '안녕하세요', state: null });
  });

  it.each([
    ['AI_QUOTA_EXCEEDED', 429, 'quota'],
    ['AI_UNAVAILABLE', 503, 'unavailable'],
    ['AI_UNAVAILABLE', 502, 'unavailable'],
    ['INVALID_INPUT', 400, 'invalidInput'],
    ['SOMETHING_NEW', 429, 'quota'],
    ['SOMETHING_NEW', 500, 'unavailable'],
    ['SOMETHING_NEW', 409, 'unknown'],
  ] as const)(
    '%s(%i)는 ApiError로 던지고 %s로 분류한다',
    async (code, status, kind) => {
      server.use(http.post(TURN, () => errorBody(code, status)));

      const error = await setup()
        .api.sendTurn('질문', null)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status, code });
      expect(classifyTurnError(error)).toBe(kind);
    },
  );

  it('연결이 끊기면 NetworkError로 던진다', async () => {
    server.use(http.post(TURN, () => HttpResponse.error()));

    const error = await setup()
      .api.sendTurn('질문', null)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NetworkError);
    expect(classifyTurnError(error)).toBe('network');
  });

  it('계약과 다른 응답은 INVALID_RESPONSE로 던진다', async () => {
    server.use(
      http.post(TURN, () => HttpResponse.json({ reply: '형식이 다름' })),
    );

    await expect(setup().api.sendTurn('질문', null)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('401이면 재발급한 뒤 같은 본문으로 한 번 다시 보낸다', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(TURN, async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1
          ? errorBody('EXPIRED_ACCESS_TOKEN', 401)
          : HttpResponse.json(reply);
      }),
      http.post(REFRESH, () => HttpResponse.json({ authenticated: true })),
    );

    await expect(setup().api.sendTurn('질문', null)).resolves.toEqual(reply);
    expect(bodies).toEqual([
      { input: '질문', state: null },
      { input: '질문', state: null },
    ]);
  });
});

describe('transcribe', () => {
  it('음성 바이트를 Content-Type과 함께 그대로 보낸다', async () => {
    let contentType: string | null = null;
    let size = 0;
    server.use(
      http.post(TRANSCRIBE, async ({ request }) => {
        contentType = request.headers.get('content-type');
        size = (await request.arrayBuffer()).byteLength;
        return HttpResponse.json({ text: '허리가 아파요' });
      }),
    );
    const audio = new Blob([new Uint8Array(32)], {
      type: 'audio/webm;codecs=opus',
    });

    await expect(setup().api.transcribe(audio)).resolves.toBe('허리가 아파요');
    expect(contentType).toBe('audio/webm;codecs=opus');
    expect(size).toBe(32);
  });

  it('너무 큰 음성(413)은 tooLarge, 서버 장애는 unavailable, 연결 실패는 network다', async () => {
    const audio = new Blob([new Uint8Array(4)], { type: 'audio/mp4' });
    const { api } = setup();

    server.use(
      http.post(TRANSCRIBE, () => errorBody('AI_AUDIO_TOO_LARGE', 413)),
    );
    expect(
      classifyTranscribeError(
        await api.transcribe(audio).catch((e: unknown) => e),
      ),
    ).toBe('tooLarge');

    server.use(http.post(TRANSCRIBE, () => errorBody('AI_UNAVAILABLE', 503)));
    expect(
      classifyTranscribeError(
        await api.transcribe(audio).catch((e: unknown) => e),
      ),
    ).toBe('unavailable');

    server.use(http.post(TRANSCRIBE, () => HttpResponse.error()));
    expect(
      classifyTranscribeError(
        await api.transcribe(audio).catch((e: unknown) => e),
      ),
    ).toBe('network');
  });
});
