import type { PriceSortOrder } from './price-stream';

/**
 * 병원 행에 크게 쓰는 대표 가격. 목록이 정렬된 기준(낮은 가격순은 최저가, 높은 가격순은 최고가)과 같게 둬서
 * 큰 숫자가 정렬 순서대로 읽히게 하고, 세부 가격이 여럿이면 반대쪽 끝을 작게 함께 쓴다.
 */
export function representativePrice(
  group: { minPrice: number; maxPrice: number },
  sort: PriceSortOrder,
) {
  const hasSpread = group.maxPrice > group.minPrice;
  if (sort === 'price_desc') {
    return {
      price: group.maxPrice,
      other: hasSpread
        ? { kind: 'minimum' as const, price: group.minPrice }
        : null,
    };
  }
  return {
    price: group.minPrice,
    other: hasSpread
      ? { kind: 'maximum' as const, price: group.maxPrice }
      : null,
  };
}
