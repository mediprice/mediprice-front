const KEY = 'mpDepth';

type Snapshot = { depth: number; length: number };

/**
 * 이번 기록 칸이 앱 안에서 몇 번째 화면인지 정한다. 이미 표시가 있으면(뒤로·앞으로·새로 고침) 그 값을 쓰고,
 * 없으면 기록 길이가 늘었을 때만 앞 칸 + 1로 본다(replace는 같은 깊이). 처음 들어온 칸은 0이다.
 */
export function nextDepth(
  stamped: unknown,
  length: number,
  previous: Snapshot | null,
): number {
  if (typeof stamped === 'number' && Number.isInteger(stamped) && stamped >= 0)
    return stamped;
  if (!previous) return 0;
  return length > previous.length ? previous.depth + 1 : previous.depth;
}

let last: Snapshot | null = null;

/** 화면이 바뀐 뒤 불러 이번 기록 칸에 깊이를 적는다. */
export function stampHistoryDepth() {
  const state: Record<string, unknown> = window.history.state ?? {};
  const depth = nextDepth(state[KEY], window.history.length, last);
  last = { depth, length: window.history.length };
  if (state[KEY] !== depth) {
    window.history.replaceState(
      { ...state, [KEY]: depth },
      '',
      window.location.href,
    );
  }
}

/** 앱 안에서 이동해 온 기록이 있어 브라우저 뒤로 가기가 이 사이트 안에 머무는지. */
export function canGoBackInApp() {
  const depth = (window.history.state as Record<string, unknown> | null)?.[KEY];
  return typeof depth === 'number' && depth > 0;
}
