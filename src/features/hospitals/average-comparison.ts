export type AverageComparison = {
  direction: 'below' | 'above' | 'same';
  /** 평균과의 차이(%)를 반올림한 값. same이면 0이다. */
  percent: number;
};

/** 이 병원 가격이 지역 평균보다 몇 % 싸거나 비싼가. 반올림해 0%면 같다고 보고, 0원이 아닌데 100% 싸다고 말하지 않게 99%에서 멈춘다. */
export function compareToAverage(
  price: number | null | undefined,
  average: number | null | undefined,
): AverageComparison | null {
  if (price == null || average == null) return null;
  if (!Number.isFinite(price) || !Number.isFinite(average)) return null;
  if (average <= 0 || price < 0) return null;
  const percent = Math.round((Math.abs(price - average) / average) * 100);
  if (percent === 0) return { direction: 'same', percent: 0 };
  if (price < average) {
    return {
      direction: 'below',
      percent: price > 0 ? Math.min(percent, 99) : 100,
    };
  }
  return { direction: 'above', percent };
}
