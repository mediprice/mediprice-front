/** 홈 AI 미리보기의 재생 시간표. 말풍선이 한 글자씩 쳐지고, 잠시 뒤 답과 항목 칩이 차례로 나온다. */
export const AI_DEMO_TIMING = {
  startDelayMs: 400,
  msPerChar: 80,
  replyDelayMs: 500,
  chipStaggerMs: 220,
} as const;

export type AiDemoFrame = {
  /** 지금까지 쳐진 글자 수(한글 음절 단위). */
  typedLength: number;
  isReplyVisible: boolean;
  visibleChips: number;
  isDone: boolean;
};

/** 재생을 시작한 뒤 elapsedMs가 지났을 때의 모습. 음수나 NaN은 시작 전으로 본다. */
export function aiDemoFrame(
  elapsedMs: number,
  textLength: number,
  chipCount: number,
  timing: typeof AI_DEMO_TIMING = AI_DEMO_TIMING,
): AiDemoFrame {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(elapsedMs, 0) : 0;
  const typingMs = elapsed - timing.startDelayMs;
  const typedLength = Math.min(
    textLength,
    Math.max(0, Math.floor(typingMs / timing.msPerChar)),
  );
  const replyAt =
    timing.startDelayMs + textLength * timing.msPerChar + timing.replyDelayMs;
  const sinceReply = elapsed - replyAt;
  const isReplyVisible = sinceReply >= 0;
  const visibleChips = isReplyVisible
    ? Math.min(chipCount, Math.floor(sinceReply / timing.chipStaggerMs) + 1)
    : 0;
  return {
    typedLength,
    isReplyVisible,
    visibleChips,
    isDone: isReplyVisible && visibleChips >= chipCount,
  };
}

/** 다 재생된 모습. 서버 렌더·reduced-motion은 처음부터 이 모습이다. */
export function finalAiDemoFrame(
  textLength: number,
  chipCount: number,
): AiDemoFrame {
  return {
    typedLength: textLength,
    isReplyVisible: true,
    visibleChips: chipCount,
    isDone: true,
  };
}

/** 앞에서 length 글자. 이모지·결합 문자가 반으로 잘리지 않게 코드 포인트로 자른다. */
export function typedSlice(text: string, length: number) {
  return Array.from(text).slice(0, Math.max(length, 0)).join('');
}
