/** min~max 안에서 value의 위치(0–1). 범위 밖은 끝에 붙이고, 범위가 한 점이면 가운데로 둔다. */
export function rangePosition(min: number, max: number, value: number) {
  if (![min, max, value].every(Number.isFinite)) return 0.5;
  if (max <= min) return 0.5;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
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

export type AveragePosition = 'below' | 'equal' | 'above';

export function compareToAverage(
  value: number,
  average: number,
): AveragePosition {
  if (value < average) return 'below';
  if (value > average) return 'above';
  return 'equal';
}
