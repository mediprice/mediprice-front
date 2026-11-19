import { describe, expect, it } from 'vitest';

import { turnInputSchema, turnResponseSchema } from './schemas';

const base = {
  state: { phase: 'asking' },
  kind: 'question',
  reply: '조금만 더 알려 주세요.',
};

describe('turnResponseSchema', () => {
  it('빠진 목록·배너·남은 횟수는 기본값으로 채운다', () => {
    expect(turnResponseSchema.parse(base)).toEqual({
      ...base,
      questions: [],
      items: [],
      emergencyBanner: false,
      area: null,
      remainingTurns: null,
    });
  });

  it('장소는 시도·시군구 코드와 이름으로 받는다', () => {
    const area = {
      sidoCode: '110000',
      sgguCode: '110015',
      label: '서울 은평구',
    };
    expect(turnResponseSchema.parse({ ...base, area }).area).toEqual(area);
    expect(
      turnResponseSchema.parse({
        ...base,
        area: { sidoCode: '310000', label: '경기' },
      }).area,
    ).toEqual({ sidoCode: '310000', sgguCode: null, label: '경기' });
  });

  it('장소 형식이 다르면 대화는 그대로 두고 장소만 버린다', () => {
    const parsed = turnResponseSchema.parse({
      ...base,
      area: { sidoCode: '서울', label: '서울' },
    });
    expect(parsed.area).toBeNull();
    expect(parsed.reply).toBe(base.reply);
  });

  it('후보는 3개까지만 받는다', () => {
    const items = ['A', 'B', 'C', 'D'].map((code) => ({
      code,
      reason: '이유',
    }));
    const parsed = turnResponseSchema.parse({ ...base, kind: 'result', items });
    expect(parsed.items.map((item) => item.code)).toEqual(['A', 'B', 'C']);
  });

  it('AI 서버에 없는 종류는 거부한다', () => {
    expect(
      turnResponseSchema.safeParse({ ...base, kind: 'ended' }).success,
    ).toBe(false);
  });

  it('상태는 열어 보지 않고 객체 그대로 둔다', () => {
    const state = {
      phase: 'result',
      slots: { body_part: '허리' },
      history: [],
    };
    expect(turnResponseSchema.parse({ ...base, state }).state).toEqual(state);
    expect(turnResponseSchema.safeParse({ ...base, state: null }).success).toBe(
      false,
    );
  });
});

describe('turnInputSchema', () => {
  it('앞뒤 공백을 자르고 빈 입력과 1000자 초과를 막는다', () => {
    expect(turnInputSchema.parse('  허리가 아파요 ')).toBe('허리가 아파요');
    expect(turnInputSchema.safeParse('   ').success).toBe(false);
    expect(turnInputSchema.safeParse('가'.repeat(1001)).success).toBe(false);
    expect(turnInputSchema.safeParse('가'.repeat(1000)).success).toBe(true);
  });
});
