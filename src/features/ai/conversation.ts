import type { TurnFailure } from './ai-errors';
import type {
  TurnItem,
  TurnKind,
  TurnQuestion,
  TurnResponse,
  TurnState,
} from './schemas';

/** mediprice-ai의 MAX_USER_TURNS. 대화 안에서 남은 턴은 AI 상태의 user_turns로 센다. */
export const SESSION_TURN_LIMIT = 6;

type UserMessage = { id: string; role: 'user'; text: string };
export type AssistantMessage = {
  id: string;
  role: 'assistant';
  kind: Exclude<TurnKind, 'error'>;
  text: string;
  questions: TurnQuestion[];
  items: TurnItem[];
};
type ChatMessage = UserMessage | AssistantMessage;

/** 오늘 남은 횟수는 로그인 여부마다 따로 센다. 비회원으로 한도를 다 쓴 뒤 로그인하면 그 값은 더 이상 맞지 않다. */
export type DailyScope = 'anonymous' | 'member';

/** stopped는 자해 표현으로 멈춘 대화, ended는 횟수를 다 쓴 대화다. 둘 다 더 보낼 수 없다. */
type ConversationStatus = 'idle' | 'sending' | 'failed' | 'stopped' | 'ended';

export type Conversation = {
  messages: ChatMessage[];
  /** AI 서버가 준 상태. 다음 턴과 재시도에 그대로 보낸다. */
  serverState: TurnState | null;
  status: ConversationStatus;
  /** 답을 기다리거나 실패한 입력. 재시도는 이 입력과 serverState를 다시 보낸다. */
  pendingInput: string | null;
  /** 늦게 온 응답이 새 대화에 섞이지 않게 요청마다 바꾼다. */
  requestId: string | null;
  failure: TurnFailure | null;
  hasEmergency: boolean;
  /** 마지막 응답이 알려 준 오늘 남은 횟수와, 그 값이 누구 기준인지. */
  remainingTurns: number | null;
  dailyScope: DailyScope | null;
};

export type ConversationAction =
  | {
      type: 'send';
      requestId: string;
      messageId: string;
      text: string;
      scope: DailyScope;
    }
  | { type: 'retry'; requestId: string; scope: DailyScope }
  | {
      type: 'receive';
      requestId: string;
      messageId: string;
      response: TurnResponse;
    }
  | { type: 'fail'; requestId: string; failure: TurnFailure }
  | { type: 'restart' };

export const INITIAL_CONVERSATION: Conversation = {
  messages: [],
  serverState: null,
  status: 'idle',
  pendingInput: null,
  requestId: null,
  failure: null,
  hasEmergency: false,
  remainingTurns: null,
  dailyScope: null,
};

export function canSend(conversation: Conversation) {
  return conversation.status === 'idle' || conversation.status === 'failed';
}

export function canRetry(conversation: Conversation) {
  return (
    conversation.status === 'failed' &&
    conversation.pendingInput !== null &&
    conversation.failure !== 'invalidInput'
  );
}

/** AI 상태(snake_case, 불투명)의 user_turns로 이 대화에서 더 말할 수 있는 횟수를 센다. */
function sessionTurnsLeft(state: TurnState | null) {
  const used = state?.user_turns;
  return SESSION_TURN_LIMIT - (typeof used === 'number' ? used : 0);
}

export function isNearEnd(conversation: Conversation) {
  return (
    conversation.status === 'idle' &&
    sessionTurnsLeft(conversation.serverState) === 1
  );
}

/** 지금 로그인 상태 기준의 오늘 남은 횟수. 모르거나 다른 상태에서 받은 값이면 null이다. */
export function dailyRemaining(conversation: Conversation, scope: DailyScope) {
  return conversation.dailyScope === scope ? conversation.remainingTurns : null;
}

/** 오늘 한도를 다 썼는지(429를 받았거나 남은 횟수가 0). 로그인해서 기준이 바뀌면 다시 보낼 수 있다. */
export function isOverDailyLimit(
  conversation: Conversation,
  scope: DailyScope,
) {
  if (conversation.dailyScope !== scope) return false;
  return (
    (conversation.status === 'failed' && conversation.failure === 'quota') ||
    conversation.remainingTurns === 0
  );
}

function withScope(conversation: Conversation, scope: DailyScope) {
  return conversation.dailyScope === scope
    ? {}
    : { dailyScope: scope, remainingTurns: null };
}

/** 실패한 입력을 두고 새로 보내면, 답을 받지 못한 이전 말풍선은 대화에서 뺀다. */
function withoutUnanswered(conversation: Conversation) {
  const last = conversation.messages.at(-1);
  return conversation.status === 'failed' && last?.role === 'user'
    ? conversation.messages.slice(0, -1)
    : conversation.messages;
}

function statusAfter(response: TurnResponse): ConversationStatus {
  if (response.kind === 'self_harm') return 'stopped';
  if (response.kind === 'limit' || sessionTurnsLeft(response.state) <= 0) {
    return 'ended';
  }
  return 'idle';
}

export function conversationReducer(
  conversation: Conversation,
  action: ConversationAction,
): Conversation {
  switch (action.type) {
    case 'send': {
      if (!canSend(conversation)) return conversation;
      return {
        ...conversation,
        messages: [
          ...withoutUnanswered(conversation),
          { id: action.messageId, role: 'user', text: action.text },
        ],
        status: 'sending',
        pendingInput: action.text,
        requestId: action.requestId,
        failure: null,
        ...withScope(conversation, action.scope),
      };
    }
    case 'retry': {
      if (!canRetry(conversation)) return conversation;
      return {
        ...conversation,
        status: 'sending',
        requestId: action.requestId,
        failure: null,
        ...withScope(conversation, action.scope),
      };
    }
    case 'receive': {
      if (
        conversation.status !== 'sending' ||
        conversation.requestId !== action.requestId
      ) {
        return conversation;
      }
      const { response } = action;
      const hasEmergency =
        conversation.hasEmergency || response.emergencyBanner;
      /** AI 서버는 error일 때 받은 상태를 그대로 돌려주므로 같은 입력으로 다시 보낼 수 있다. */
      if (response.kind === 'error') {
        return {
          ...conversation,
          status: 'failed',
          failure: 'unavailable',
          hasEmergency,
        };
      }
      return {
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            id: action.messageId,
            role: 'assistant',
            kind: response.kind,
            text: response.reply,
            questions: response.questions,
            items: response.kind === 'result' ? response.items : [],
          },
        ],
        serverState: response.state,
        status: statusAfter(response),
        pendingInput: null,
        failure: null,
        hasEmergency,
        remainingTurns: response.remainingTurns,
      };
    }
    case 'fail': {
      if (
        conversation.status !== 'sending' ||
        conversation.requestId !== action.requestId
      ) {
        return conversation;
      }
      return { ...conversation, status: 'failed', failure: action.failure };
    }
    case 'restart':
      return INITIAL_CONVERSATION;
  }
}

/** 저장해 둔 대화를 다시 열 때, 답을 기다리던 요청은 이미 끊겼으므로 재시도할 수 있는 실패로 바꾼다. */
export function resumeConversation(saved: Conversation): Conversation {
  if (saved.status !== 'sending') return saved;
  return { ...saved, status: 'failed', failure: 'interrupted' };
}
