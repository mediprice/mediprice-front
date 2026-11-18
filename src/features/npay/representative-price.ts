import type { HospitalPrice, PriceSortOrder } from './price-stream';

/**
 * 병원 행에 크게 쓰는 대표 세부 항목. 목록이 정렬된 기준(낮은 가격순은 가장 낮은 것, 높은 가격순은 가장 높은 것)과 같게 둬서
 * 큰 숫자가 정렬 순서대로 읽히게 하고, 세부 가격이 여럿이면 반대쪽 끝을 작게 함께 쓴다. 같은 값이면 먼저 나온 행이다.
 */
export function representativeVariant(
  variants: readonly HospitalPrice[],
  sort: PriceSortOrder,
) {
  const [first] = variants;
  if (!first) return null;
  let low = first;
  let high = first;
  for (const variant of variants) {
    if (variant.price < low.price) low = variant;
    if (variant.price > high.price) high = variant;
  }
  const hasSpread = high.price > low.price;
  if (sort === 'price_desc') {
    return {
      variant: high,
      other: hasSpread ? { kind: 'minimum' as const, price: low.price } : null,
    };
  }
  return {
    variant: low,
    other: hasSpread ? { kind: 'maximum' as const, price: high.price } : null,
  };
}
