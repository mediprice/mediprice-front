import { z } from 'zod';
import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

import { classifyTurnError } from './ai-errors';
import { type AiApi, aiApi } from './api';
import {
  type Conversation,
  type ConversationAction,
  conversationReducer,
  type DailyScope,
  INITIAL_CONVERSATION,
  resumeConversation,
} from './conversation';
import {
  TURN_KINDS,
  turnAreaSchema,
  turnInputSchema,
  turnItemSchema,
  turnQuestionSchema,
  turnStateSchema,
} from './schemas';

export const CONVERSATION_STORAGE_KEY = 'mediprice:ai-conversation';

/** 답을 이만큼 기다려도 오지 않으면 끊고 다시 보낼 수 있게 한다. 서버 처리 시간(보통 20초 남짓)보다 넉넉히 둔다. */
export const TURN_TIMEOUT_MS = 60_000;

type ConversationStore = Conversation & {
  /** 지금 기다리는 요청을 보낸 시각(ms). 저장하지 않고, 기다림 안내가 다시 그려져도 같은 기준으로 센다. */
  sentAt: number | null;
  /** 보낼 수 없는 상태이거나 빈 입력이면 false다. 답은 기다리지 않는다. */
  send: (text: string, scope: DailyScope) => boolean;
  retry: (scope: DailyScope) => void;
  /** 기다리던 요청을 끊는다. 입력은 남아 다시 보낼 수 있다. */
  cancel: () => void;
  restart: () => void;
};

const storedSchema = z.object({
  messages: z.array(
    z.discriminatedUnion('role', [
      z.object({ id: z.string(), role: z.literal('user'), text: z.string() }),
      z.object({
        id: z.string(),
        role: z.literal('assistant'),
        kind: z.enum(TURN_KINDS).exclude(['error']),
        text: z.string(),
        questions: z.array(turnQuestionSchema),
        items: z.array(turnItemSchema),
        /** 장소를 받기 전에 저장된 대화에는 없다. */
        area: turnAreaSchema.nullable().catch(null),
      }),
    ]),
  ),
  serverState: turnStateSchema.nullable(),
  status: z.enum(['idle', 'sending', 'failed', 'stopped', 'ended']),
  pendingInput: z.string().nullable(),
  requestId: z.string().nullable(),
  failure: z
    .enum([
      'quota',
      'unavailable',
      'network',
      'invalidInput',
      'interrupted',
      'cancelled',
      'unknown',
    ])
    .nullable(),
  hasEmergency: z.boolean(),
  remainingTurns: z.number().int().nonnegative().nullable(),
  dailyScope: z.enum(['anonymous', 'member']).nullable().default(null),
});

function pickConversation(state: ConversationStore): Conversation {
  const {
    messages,
    serverState,
    status,
    pendingInput,
    requestId,
    failure,
    hasEmergency,
    remainingTurns,
    dailyScope,
  } = state;
  return {
    messages,
    serverState,
    status,
    pendingInput,
    requestId,
    failure,
    hasEmergency,
    remainingTurns,
    dailyScope,
  };
}

/** 화면을 떠나도 진행 중인 답이 대화에 들어가도록 요청은 컴포넌트가 아니라 저장소가 보낸다. */
export function createConversationStore({
  api,
  createId = () => crypto.randomUUID(),
  timeoutMs = TURN_TIMEOUT_MS,
}: {
  api: Pick<AiApi, 'sendTurn'>;
  createId?: () => string;
  timeoutMs?: number;
}) {
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function abortPending() {
    clearTimeout(timer);
    controller?.abort();
    controller = null;
  }

  return createStore<ConversationStore>()(
    persist(
      (set, get) => {
        const dispatch = (action: ConversationAction) =>
          set((state) => conversationReducer(pickConversation(state), action));

        /** 실패로 먼저 바꾼 뒤 끊으므로, 끊긴 요청이 던지는 오류는 reducer가 무시한다. */
        function stop(failure: 'cancelled' | 'unavailable') {
          const { status, requestId } = get();
          if (status !== 'sending' || requestId === null) return;
          dispatch({ type: 'fail', requestId, failure });
          abortPending();
        }

        async function request(requestId: string) {
          const { pendingInput, serverState } = get();
          if (pendingInput === null) return;
          abortPending();
          controller = new AbortController();
          set({ sentAt: Date.now() });
          timer = setTimeout(() => stop('unavailable'), timeoutMs);
          try {
            const response = await api.sendTurn(pendingInput, serverState, {
              signal: controller.signal,
            });
            dispatch({
              type: 'receive',
              requestId,
              messageId: createId(),
              response,
            });
          } catch (error) {
            dispatch({
              type: 'fail',
              requestId,
              failure: classifyTurnError(error),
            });
          } finally {
            if (get().requestId === requestId) clearTimeout(timer);
          }
        }

        return {
          ...INITIAL_CONVERSATION,
          sentAt: null,
          send: (text, scope) => {
            const parsed = turnInputSchema.safeParse(text);
            if (!parsed.success) return false;
            const requestId = createId();
            dispatch({
              type: 'send',
              requestId,
              messageId: createId(),
              text: parsed.data,
              scope,
            });
            if (get().requestId !== requestId) return false;
            void request(requestId);
            return true;
          },
          retry: (scope) => {
            const requestId = createId();
            dispatch({ type: 'retry', requestId, scope });
            if (get().requestId === requestId) void request(requestId);
          },
          cancel: () => stop('cancelled'),
          restart: () => {
            abortPending();
            dispatch({ type: 'restart' });
          },
        };
      },
      {
        name: CONVERSATION_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(() => sessionStorage),
        partialize: pickConversation,
        /** 저장소 값은 다른 버전이거나 사용자가 고친 값일 수 있어 검증하고, 틀리면 새 대화로 시작한다. */
        merge: (persisted, current) => {
          const parsed = storedSchema.safeParse(persisted);
          if (!parsed.success) return current;
          return { ...current, ...resumeConversation(parsed.data) };
        },
        /** 서버 렌더링 결과(빈 대화)와 맞추려고 하이드레이션 뒤에 AiChat이 불러온다. */
        skipHydration: true,
      },
    ),
  );
}

export const conversationStore = createConversationStore({ api: aiApi });

/** 서버에는 sessionStorage가 없어 zustand가 persist API를 붙이지 않으므로, 없을 때는 아무것도 하지 않는다. */
function persistApi(): (typeof conversationStore)['persist'] | undefined {
  return conversationStore.persist;
}

export function restoreConversation() {
  return persistApi()?.rehydrate();
}

/** 저장한 대화를 불러왔는지. useSyncExternalStore에 넘긴다(서버 렌더는 항상 false). */
export const restoredState = {
  subscribe: (listener: () => void) =>
    persistApi()?.onFinishHydration(listener) ?? (() => {}),
  get: () => persistApi()?.hasHydrated() ?? false,
  getServer: () => false,
};

export function useConversation<T>(selector: (state: ConversationStore) => T) {
  return useStore(conversationStore, selector);
}
