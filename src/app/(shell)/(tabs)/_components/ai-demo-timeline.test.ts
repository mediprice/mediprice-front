import { describe, expect, it } from 'vitest';

import {
  AI_DEMO_TIMING,
  aiDemoFrame,
  finalAiDemoFrame,
  typedSlice,
} from './ai-demo-timeline';

const { startDelayMs, msPerChar, replyDelayMs, chipStaggerMs } = AI_DEMO_TIMING;
const TEXT_LENGTH = 10;
const replyAt = startDelayMs + TEXT_LENGTH * msPerChar + replyDelayMs;

describe('aiDemoFrame', () => {
  it('시작 전에는 아무것도 보이지 않는다', () => {
    expect(aiDemoFrame(0, TEXT_LENGTH, 2)).toEqual({
      typedLength: 0,
      isReplyVisible: false,
      visibleChips: 0,
      isDone: false,
    });
    expect(aiDemoFrame(-100, TEXT_LENGTH, 2).typedLength).toBe(0);
    expect(aiDemoFrame(Number.NaN, TEXT_LENGTH, 2).typedLength).toBe(0);
  });

  it('글자는 일정한 간격으로 하나씩 쳐지고 전체 길이를 넘지 않는다', () => {
    expect(aiDemoFrame(startDelayMs + msPerChar * 3, TEXT_LENGTH, 2)).toEqual(
      expect.objectContaining({ typedLength: 3, isReplyVisible: false }),
    );
    expect(aiDemoFrame(replyAt - 1, TEXT_LENGTH, 2)).toEqual(
      expect.objectContaining({ typedLength: TEXT_LENGTH, visibleChips: 0 }),
    );
  });

  it('다 쳐진 뒤 잠시 있다가 답이 나오고 칩이 차례로 붙는다', () => {
    expect(aiDemoFrame(replyAt, TEXT_LENGTH, 2)).toEqual(
      expect.objectContaining({ isReplyVisible: true, visibleChips: 1 }),
    );
    expect(aiDemoFrame(replyAt + chipStaggerMs, TEXT_LENGTH, 2)).toEqual({
      typedLength: TEXT_LENGTH,
      isReplyVisible: true,
      visibleChips: 2,
      isDone: true,
    });
    expect(aiDemoFrame(replyAt + 10_000, TEXT_LENGTH, 2).visibleChips).toBe(2);
  });

  it('끝난 모습은 다 재생된 프레임과 같다', () => {
    expect(aiDemoFrame(replyAt + 10_000, TEXT_LENGTH, 2)).toEqual(
      finalAiDemoFrame(TEXT_LENGTH, 2),
    );
  });
});

describe('typedSlice', () => {
  it('한글을 음절 단위로 자른다', () => {
    expect(typedSlice('허리가 아파요', 3)).toBe('허리가');
    expect(typedSlice('허리', 10)).toBe('허리');
    expect(typedSlice('허리', -1)).toBe('');
  });
});
