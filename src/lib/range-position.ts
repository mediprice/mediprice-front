export type RangeScale = {
  min: number;
  max: number;
  average?: number | null;
};

/**
 * 막대 위 value의 위치(0–1). 평균이 범위 안에 있으면 최저→평균을 0–0.5, 평균→최고를 0.5–1에 놓는다(구간별 직선).
 * 실제 가격은 "1일당 1,000원" 같은 극단값이 있어 그냥 직선이면 점이 모두 한쪽 끝에 몰린다. 평균이 없거나 끝과 같으면 직선이다.
 * 범위 밖은 끝에 붙이고, 범위가 한 점이거나 숫자가 아니면 가운데로 둔다.
 */
export function rangePosition(
  { min, max, average }: RangeScale,
  value: number,
) {
  if (![min, max, value].every(Number.isFinite)) return 0.5;
  if (max <= min) return 0.5;
  const clamped = Math.min(max, Math.max(min, value));
  if (
    average == null ||
    !Number.isFinite(average) ||
    average <= min ||
    average >= max
  ) {
    return (clamped - min) / (max - min);
  }
  if (clamped <= average) return ((clamped - min) / (average - min)) * 0.5;
  return 0.5 + ((clamped - average) / (max - average)) * 0.5;
}

/** 막대를 그릴 만한 범위인가. 값이 없거나 최저와 최고가 같으면 막대가 의미 없다. */
export function hasRange(
  min: number | null | undefined,
  max: number | null | undefined,
): boolean {
  return (
    min != null &&
    max != null &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    max > min
  );
}
