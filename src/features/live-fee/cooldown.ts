/** 확인할 때마다 심평원 누리집을 실제로 조회하므로, 같은 병원·항목은 이 시간 동안 다시 부르지 않는다. */
export const LIVE_FEE_COOLDOWN_MS = 60_000;

type CooldownStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function cooldownKey(ykiho: string, npayCode: string) {
  return `mediprice:live-fee:${ykiho}:${npayCode}`;
}

/** 저장소 값은 사용자가 고칠 수 있어 숫자가 아니거나 너무 먼 미래면 무시한다. */
export function readCooldownUntil(
  storage: CooldownStorage | null,
  key: string,
  now: number,
) {
  const until = Number(storage?.getItem(key));
  if (!Number.isFinite(until) || until > now + LIVE_FEE_COOLDOWN_MS) return 0;
  return until;
}

/** 저장소가 가득 차거나 막혀 있어도 확인은 계속한다. 그때는 화면 상태만으로 막는다. */
export function startCooldown(
  storage: CooldownStorage | null,
  key: string,
  now: number,
) {
  const until = now + LIVE_FEE_COOLDOWN_MS;
  try {
    storage?.setItem(key, String(until));
  } catch {
    return until;
  }
  return until;
}

export function secondsUntil(until: number, now: number) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}
