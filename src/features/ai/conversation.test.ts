import { describe, expect, it } from 'vitest';

import {
  canRetry,
  canSend,
  type Conversation,
  type ConversationAction,
  conversationReducer,
  dailyRemaining,
  type DailyScope,
  INITIAL_CONVERSATION,
  isNearEnd,
  isOverDailyLimit,
  resumeConversation,
  shouldConfirmRestart,
} from './conversation';
import type { TurnResponse } from './schemas';

function response(overrides: Partial<TurnResponse> = {}): TurnResponse {
  return {
    state: { phase: 'asking' },
    kind: 'question',
    reply: '어느 부위인가요?',
    questions: [
      { about: '부위', text: '어느 부위인가요?', options: ['허리', '모름'] },
    ],
    items: [],
    emergencyBanner: false,
    area: null,
    remainingTurns: 5,
    ...overrides,
  };
}

function run(...actions: ConversationAction[]) {
  return actions.reduce<Conversation>(
    conversationReducer,
    INITIAL_CONVERSATION,
  );
}

const send = (
  text: string,
  n = 1,
  scope: DailyScope = 'anonymous',
): ConversationAction => ({
  type: 'send',
  requestId: `r${n}`,
  messageId: `u${n}`,
  text,
  scope,
});
const receive = (r: TurnResponse, n = 1): ConversationAction => ({
  type: 'receive',
  requestId: `r${n}`,
  messageId: `a${n}`,
  response: r,
});

describe('conversationReducer', () => {
  it('보내면 내 말풍선을 붙이고 답을 기다린다', () => {
    const state = run(send('허리가 아파요'));
    expect(state.status).toBe('sending');
    expect(state.pendingInput).toBe('허리가 아파요');
    expect(state.messages).toEqual([
      { id: 'u1', role: 'user', text: '허리가 아파요' },
    ]);
    expect(canSend(state)).toBe(false);
  });

  it('답을 받으면 AI 말풍선과 서버 상태를 저장한다', () => {
    const state = run(send('허리가 아파요'), receive(response()));
    expect(state.status).toBe('idle');
    expect(state.serverState).toEqual({ phase: 'asking' });
    expect(state.pendingInput).toBeNull();
    expect(state.remainingTurns).toBe(5);
    expect(state.messages[1]).toMatchObject({
      role: 'assistant',
      kind: 'question',
    });
  });

  it('기다리는 중에는 새로 보내지 않는다', () => {
    const state = run(send('하나'), send('둘', 2));
    expect(state.messages).toHaveLength(1);
    expect(state.requestId).toBe('r1');
  });

  it('다른 요청의 늦은 답은 무시한다(새 대화를 시작한 뒤 도착한 답 등)', () => {
    const state = run(send('하나'), { type: 'restart' }, receive(response()));
    expect(state).toEqual({ ...INITIAL_CONVERSATION, dailyScope: 'anonymous' });
  });

  it('새 대화를 시작해도 오늘 남은 횟수는 남긴다', () => {
    const state = run(
      send('허리가 아파요'),
      receive(response({ remainingTurns: 1 })),
      { type: 'restart' },
    );
    expect(state.messages).toEqual([]);
    expect(dailyRemaining(state, 'anonymous')).toBe(1);
  });

  it('오늘 한도에 걸린 뒤 새 대화를 시작해도 한도는 그대로다', () => {
    const state = run(
      send('허리가 아파요'),
      { type: 'fail', requestId: 'r1', failure: 'quota' },
      { type: 'restart' },
    );
    expect(isOverDailyLimit(state, 'anonymous')).toBe(true);
    expect(isOverDailyLimit(state, 'member')).toBe(false);
  });

  it('실패하면 입력과 서버 상태를 그대로 두고 재시도할 수 있다', () => {
    const first = run(send('허리가 아파요'), receive(response()));
    const failed = conversationReducer(
      conversationReducer(first, send('아랫허리', 2)),
      { type: 'fail', requestId: 'r2', failure: 'unavailable' },
    );
    expect(failed.status).toBe('failed');
    expect(failed.pendingInput).toBe('아랫허리');
    expect(failed.serverState).toEqual(first.serverState);
    expect(canRetry(failed)).toBe(true);

    const retried = conversationReducer(failed, {
      type: 'retry',
      requestId: 'r3',
      scope: 'anonymous',
    });
    expect(retried.status).toBe('sending');
    expect(retried.requestId).toBe('r3');
    expect(retried.messages).toHaveLength(3);
  });

  it('AI 서버의 error 답은 실패로 보고 상태를 바꾸지 않는다', () => {
    const state = run(
      send('허리가 아파요'),
      receive(
        response({
          kind: 'error',
          reply: '잠시 문제가 생겼어요.',
          emergencyBanner: true,
        }),
      ),
    );
    expect(state.status).toBe('failed');
    expect(state.failure).toBe('unavailable');
    expect(state.serverState).toBeNull();
    expect(state.messages).toHaveLength(1);
    expect(state.hasEmergency).toBe(true);
  });

  it('입력이 잘못됐으면 재시도 대신 새로 쓰게 한다', () => {
    const state = run(send('?'), {
      type: 'fail',
      requestId: 'r1',
      failure: 'invalidInput',
    });
    expect(canRetry(state)).toBe(false);
    expect(canSend(state)).toBe(true);
  });

  it('실패한 뒤 새로 보내면 답을 못 받은 말풍선을 바꾼다', () => {
    const state = run(
      send('첫 질문'),
      { type: 'fail', requestId: 'r1', failure: 'network' },
      send('다시 쓴 질문', 2),
    );
    expect(state.messages.map((m) => m.role === 'user' && m.text)).toEqual([
      '다시 쓴 질문',
    ]);
  });

  it('응급 배너는 한 번 켜지면 대화 내내 남는다', () => {
    const state = run(
      send('가슴이 아프고 숨이 차요'),
      receive(response({ emergencyBanner: true })),
      send('허리', 2),
      receive(response({ emergencyBanner: false }), 2),
    );
    expect(state.hasEmergency).toBe(true);
  });

  it('자해 표현이면 대화를 멈춘다', () => {
    const state = run(
      send('...'),
      receive(response({ kind: 'self_harm', questions: [] })),
    );
    expect(state.status).toBe('stopped');
    expect(canSend(state)).toBe(false);
  });

  it('limit 답이나 대화 턴을 다 쓰면 대화를 끝낸다', () => {
    expect(run(send('a'), receive(response({ kind: 'limit' }))).status).toBe(
      'ended',
    );
    expect(
      run(
        send('a'),
        receive(response({ kind: 'result', state: { user_turns: 6 } })),
      ).status,
    ).toBe('ended');
  });

  it('오늘 남은 횟수(remainingTurns)가 0이어도 대화 자체는 끝내지 않는다', () => {
    expect(
      run(send('a'), receive(response({ kind: 'result', remainingTurns: 0 })))
        .status,
    ).toBe('idle');
  });

  it('대화에서 한 번만 더 말할 수 있으면 끝나기 직전이다', () => {
    expect(
      isNearEnd(
        run(send('a'), receive(response({ state: { user_turns: 5 } }))),
      ),
    ).toBe(true);
    expect(
      isNearEnd(
        run(send('a'), receive(response({ state: { user_turns: 4 } }))),
      ),
    ).toBe(false);
  });

  it('결과가 아닌 답의 항목은 버린다', () => {
    const state = run(
      send('a'),
      receive(
        response({ kind: 'no_match', items: [{ code: 'X', reason: '' }] }),
      ),
    );
    expect(state.messages[1]).toMatchObject({ kind: 'no_match', items: [] });
  });
});

describe('오늘 남은 횟수', () => {
  it('응답의 남은 횟수는 보낸 사람의 로그인 상태 기준이다', () => {
    const state = run(send('a'), receive(response({ remainingTurns: 2 })));
    expect(dailyRemaining(state, 'anonymous')).toBe(2);
    expect(dailyRemaining(state, 'member')).toBeNull();
  });

  it('남은 횟수 0이나 429면 한도를 다 쓴 것이다', () => {
    expect(
      isOverDailyLimit(
        run(send('a'), receive(response({ remainingTurns: 0 }))),
        'anonymous',
      ),
    ).toBe(true);
    const quota = run(send('a'), {
      type: 'fail',
      requestId: 'r1',
      failure: 'quota',
    });
    expect(isOverDailyLimit(quota, 'anonymous')).toBe(true);
  });

  it('비회원으로 한도를 다 쓴 뒤 로그인하면 막지 않고 다시 보낼 수 있다', () => {
    const quota = run(send('a'), {
      type: 'fail',
      requestId: 'r1',
      failure: 'quota',
    });
    expect(isOverDailyLimit(quota, 'member')).toBe(false);
    const retried = conversationReducer(quota, {
      type: 'retry',
      requestId: 'r2',
      scope: 'member',
    });
    expect(retried).toMatchObject({
      status: 'sending',
      dailyScope: 'member',
      remainingTurns: null,
    });
  });
});

describe('resumeConversation', () => {
  it('답을 기다리던 대화는 재시도할 수 있는 실패로 연다', () => {
    const resumed = resumeConversation(run(send('허리가 아파요')));
    expect(resumed.status).toBe('failed');
    expect(resumed.failure).toBe('interrupted');
    expect(canRetry(resumed)).toBe(true);
  });
});

describe('shouldConfirmRestart', () => {
  it('답을 받았거나 기다리는 중이면 확인받는다', () => {
    expect(shouldConfirmRestart(INITIAL_CONVERSATION)).toBe(false);
    expect(shouldConfirmRestart(run(send('하나')))).toBe(true);
    expect(shouldConfirmRestart(run(send('하나'), receive(response())))).toBe(
      true,
    );
  });

  it('답 없이 실패한 입력만 있으면 바로 지운다', () => {
    const failed = run(send('하나'), {
      type: 'fail',
      requestId: 'r1',
      failure: 'network',
    });
    expect(shouldConfirmRestart(failed)).toBe(false);
  });
});
