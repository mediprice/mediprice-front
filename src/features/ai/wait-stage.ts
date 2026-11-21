/** 답을 기다린 시간에 따라 안내를 바꾼다. slow는 걸리는 시간을 알리고, long은 계속 기다릴지 묻는다. */
export type WaitStage = 'quiet' | 'slow' | 'long';

const WAIT_STAGE_FROM = { slow: 8_000, long: 30_000 } as const;

export function waitStage(elapsedMs: number): WaitStage {
  if (elapsedMs >= WAIT_STAGE_FROM.long) return 'long';
  if (elapsedMs >= WAIT_STAGE_FROM.slow) return 'slow';
  return 'quiet';
}

/** 다음 안내로 바뀔 때까지 남은 시간(ms). 마지막 단계면 null이다. */
export function msUntilNextStage(elapsedMs: number): number | null {
  if (elapsedMs < WAIT_STAGE_FROM.slow) return WAIT_STAGE_FROM.slow - elapsedMs;
  if (elapsedMs < WAIT_STAGE_FROM.long) return WAIT_STAGE_FROM.long - elapsedMs;
  return null;
}
