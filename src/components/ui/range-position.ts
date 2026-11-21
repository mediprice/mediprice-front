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

export type AverageComparison = {
  direction: 'below' | 'above' | 'same';
  /** 평균과의 차이(%)를 반올림한 값. same이면 0이다. */
  percent: number;
};

/** 평균과 이만큼(%) 안쪽으로 차이 나면 "평균 수준"으로 본다. 몇 % 차이는 싼 편인지 판단하는 데 도움이 되지 않는다. */
const SAME_WITHIN_PERCENT = 5;

/**
 * 가격이 평균보다 몇 % 싸거나 비싼가. 차이가 SAME_WITHIN_PERCENT 미만이면 같다고 보고,
 * 0원이 아닌데 100% 싸다고 말하지 않게 99%에서 멈춘다. 쓸 수 없는 값이면 null이다.
 */
export function compareToAverage(
  price: number | null | undefined,
  average: number | null | undefined,
): AverageComparison | null {
  if (price == null || average == null) return null;
  if (!Number.isFinite(price) || !Number.isFinite(average)) return null;
  if (average <= 0 || price < 0) return null;
  const exact = (Math.abs(price - average) / average) * 100;
  if (exact < SAME_WITHIN_PERCENT) return { direction: 'same', percent: 0 };
  const percent = Math.round(exact);
  if (price < average) {
    return {
      direction: 'below',
      percent: price > 0 ? Math.min(percent, 99) : 100,
    };
  }
  return { direction: 'above', percent };
}
