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

/**
 * 평균의 1/3 아래이거나 3배 위인 가격은 % 차이를 말하지 않는다. 도수치료 서울·경기 2,744건에서 15분 세션 중앙값은 평균의 0.25배,
 * 100분 세션은 3.4배였다. 이 차이는 병원이 싸거나 비싸서가 아니라 시간·횟수 같은 세부 구성이 달라서 생긴다(docs 14장).
 */
const COMPARABLE_RATIO = 3;

export type AverageVerdict =
  | { kind: 'comparable'; comparison: AverageComparison }
  | { kind: 'incomparable' };

/** 대표 가격을 같은 조건의 평균과 견줄 수 있는가. 평균이 없거나 값이 이상하면 null이다. */
export function judgeAgainstAverage(
  price: number | null | undefined,
  average: number | null | undefined,
): AverageVerdict | null {
  const comparison = compareToAverage(price, average);
  if (!comparison || price == null || average == null) return null;
  const ratio = price / average;
  if (ratio < 1 / COMPARABLE_RATIO || ratio > COMPARABLE_RATIO) {
    return { kind: 'incomparable' };
  }
  return { kind: 'comparable', comparison };
}

export type PriceBand = { minPrice: number; maxPrice: number };

/**
 * 평균과 견줄 수 있는 가격 범위(경계 포함). judgeAgainstAverage가 비교하는 범위와 같아, 이 범위로 받은 행은 모두 % 꼬리표가 붙는다.
 * 가격은 원 단위 정수라 아래는 올리고 위는 내린다. 평균이 없으면 null이다.
 */
export function comparableBand(
  average: number | null | undefined,
): PriceBand | null {
  if (average == null || !(average > 0)) return null;
  return {
    minPrice: Math.ceil(average / COMPARABLE_RATIO),
    maxPrice: Math.floor(average * COMPARABLE_RATIO),
  };
}
