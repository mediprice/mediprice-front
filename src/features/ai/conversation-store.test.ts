import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/test/server';

const storage = vi.hoisted(() => {
  const values = new Map<string, string>();
  const fake = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: fake,
    configurable: true,
  });
  return fake;
});

const { createAiApi } = await import('./api');
const { CONVERSATION_STORAGE_KEY, createConversationStore } =
  await import('./conversation-store');

const BASE = 'http://app.test/bff';
const TURN = `${BASE}/api/ai/chat/turn`;

function setup() {
  let id = 0;
  return createConversationStore({
    api: createAiApi({ baseUrl: BASE }),
    createId: () => `id-${(id += 1)}`,
  });
}

type Store = ReturnType<typeof setup>;

async function settled(store: Store) {
  await vi.waitFor(() => expect(store.getState().status).not.toBe('sending'));
}

beforeEach(() => storage.clear());

describe('conversationStore', () => {
  it('질문 → 답 고르기 → 결과까지 서버 상태를 이어서 보낸다', async () => {
    const requests: unknown[] = [];
    const script = [
      {
        state: { phase: 'asking', user_turns: 1 },
        kind: 'question',
        reply: '어느 부위가 가장 불편하세요?',
        questions: [
          {
            about: '부위',
            text: '어느 부위인가요?',
            options: ['윗허리', '아랫허리', '모름'],
          },
        ],
        items: [],
        emergencyBanner: false,
        remainingTurns: 5,
      },
      {
        state: {
          phase: 'result',
          user_turns: 2,
          item_codes: ['MX1220000', 'SZ0840000'],
        },
        kind: 'result',
        reply: '허리 통증과 관련해서 사람들이 많이 찾아보는 비급여 항목이에요.',
        questions: [],
        items: [
          { code: 'MX1220000', reason: '허리 통증과 관련된 항목이에요.' },
          { code: 'SZ0840000', reason: '통증 부위 치료와 관련된 항목이에요.' },
        ],
        emergencyBanner: false,
        remainingTurns: 4,
      },
    ];
    server.use(
      http.post(TURN, async ({ request }) => {
        requests.push(await request.json());
        return HttpResponse.json(script[requests.length - 1]);
      }),
    );
    const store = setup();

    expect(store.getState().send('2주째 허리가 아파요', 'anonymous')).toBe(
      true,
    );
    await settled(store);
    expect(store.getState().send('아랫허리', 'anonymous')).toBe(true);
    await settled(store);

    expect(requests).toEqual([
      { input: '2주째 허리가 아파요', state: null },
      { input: '아랫허리', state: { phase: 'asking', user_turns: 1 } },
    ]);
    const { messages, status, remainingTurns } = store.getState();
    expect(status).toBe('idle');
    expect(remainingTurns).toBe(4);
    expect(messages.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ]);
    expect(messages[3]).toMatchObject({
      kind: 'result',
      items: [{ code: 'MX1220000' }, { code: 'SZ0840000' }],
    });
  });

  it('실패한 뒤 다시 보내기는 같은 입력과 같은 상태를 보낸다', async () => {
    const requests: unknown[] = [];
    server.use(
      http.post(TURN, async ({ request }) => {
        requests.push(await request.json());
        if (requests.length === 1) {
          return HttpResponse.json(
            { code: 'AI_UNAVAILABLE', message: '장애', errors: [] },
            { status: 503 },
          );
        }
        return HttpResponse.json({
          state: { phase: 'no_match' },
          kind: 'no_match',
          reply: '맞는 항목을 찾지 못했어요.',
        });
      }),
    );
    const store = setup();

    store.getState().send('그냥 몸이 안 좋아요', 'anonymous');
    await settled(store);
    expect(store.getState()).toMatchObject({
      status: 'failed',
      failure: 'unavailable',
    });

    store.getState().retry('anonymous');
    await settled(store);

    expect(requests).toEqual([
      { input: '그냥 몸이 안 좋아요', state: null },
      { input: '그냥 몸이 안 좋아요', state: null },
    ]);
    expect(store.getState().messages.map((m) => m.role)).toEqual([
      'user',
      'assistant',
    ]);
  });

  it('하루 한도를 넘으면 quota 실패가 된다', async () => {
    server.use(
      http.post(TURN, () =>
        HttpResponse.json(
          { code: 'AI_QUOTA_EXCEEDED', message: '한도', errors: [] },
          { status: 429 },
        ),
      ),
    );
    const store = setup();

    store.getState().send('도수치료 가격', 'anonymous');
    await settled(store);

    expect(store.getState()).toMatchObject({
      status: 'failed',
      failure: 'quota',
    });
  });

  it('빈 입력은 보내지 않는다', () => {
    const store = setup();
    expect(store.getState().send('   ', 'anonymous')).toBe(false);
    expect(store.getState().messages).toEqual([]);
  });

  it('새 대화를 시작하면 진행 중인 답을 버리고 저장소를 비운다', async () => {
    let release: () => void = () => {};
    server.use(
      http.post(TURN, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({
          state: {},
          kind: 'out_of_scope',
          reply: '범위 밖',
        });
      }),
    );
    const store = setup();

    store.getState().send('오늘 날씨 어때요?', 'anonymous');
    store.getState().restart();
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(store.getState().messages).toEqual([]);
    expect(store.getState().status).toBe('idle');
    expect(
      JSON.parse(storage.getItem(CONVERSATION_STORAGE_KEY) ?? '{}'),
    ).toMatchObject({
      state: { messages: [], status: 'idle' },
    });
  });

  it('기다리다 그만두면 요청을 끊고, 같은 입력으로 다시 보낼 수 있다', async () => {
    let aborted = false;
    const store = createConversationStore({
      api: {
        sendTurn: (_input, _state, { signal } = {}) =>
          new Promise((_, reject) => {
            signal?.addEventListener('abort', () => {
              aborted = true;
              reject(new DOMException('aborted', 'AbortError'));
            });
          }),
      },
    });

    store.getState().send('허리가 아파요', 'anonymous');
    expect(store.getState().sentAt).not.toBeNull();
    store.getState().cancel();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(aborted).toBe(true);
    expect(store.getState()).toMatchObject({
      status: 'failed',
      failure: 'cancelled',
      pendingInput: '허리가 아파요',
    });
  });

  it('정한 시간 안에 답이 없으면 끊고 다시 보낼 수 있는 실패로 바꾼다', async () => {
    server.use(http.post(TURN, () => new Promise<Response>(() => {})));
    let id = 0;
    const store = createConversationStore({
      api: createAiApi({ baseUrl: BASE }),
      createId: () => `id-${(id += 1)}`,
      timeoutMs: 30,
    });

    store.getState().send('허리가 아파요', 'anonymous');
    await settled(store);

    expect(store.getState()).toMatchObject({
      status: 'failed',
      failure: 'unavailable',
      pendingInput: '허리가 아파요',
    });
  });

  it('저장한 대화를 다시 열고, 기다리던 요청은 재시도할 수 있게 연다', async () => {
    storage.setItem(
      CONVERSATION_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          messages: [{ id: 'u1', role: 'user', text: '허리가 아파요' }],
          serverState: null,
          status: 'sending',
          pendingInput: '허리가 아파요',
          requestId: 'r1',
          failure: null,
          hasEmergency: false,
          remainingTurns: null,
        },
      }),
    );
    const store = setup();

    await store.persist.rehydrate();

    expect(store.getState()).toMatchObject({
      status: 'failed',
      failure: 'interrupted',
      pendingInput: '허리가 아파요',
    });
  });

  it('형식이 틀린 저장 값은 버리고 새 대화로 시작한다', async () => {
    storage.setItem(
      CONVERSATION_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { messages: 'broken' } }),
    );
    const store = setup();

    await store.persist.rehydrate();

    expect(store.getState().messages).toEqual([]);
    expect(store.getState().status).toBe('idle');
  });
});
