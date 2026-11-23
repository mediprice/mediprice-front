export const ROLL_DURATION_MS = 800;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/** 진행률(0–1)에서 보일 정수. 끝으로 갈수록 느려지고, 끝에서는 정확히 to다. */
export function rollingValueAt(progress: number, from: number, to: number) {
  const t = Math.min(1, Math.max(0, progress));
  if (t === 1) return to;
  return Math.round(from + (to - from) * easeOutCubic(t));
}
