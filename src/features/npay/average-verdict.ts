import {
  type AverageComparison,
  compareToAverage,
} from '@/components/ui/range-position';

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
