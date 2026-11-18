import type { HospitalPrice } from './price-stream';

export type HospitalPriceGroup = {
  ykiho: string;
  hospitalName: string;
  className: string | null;
  sidoName: string | null;
  sgguName: string | null;
  /** 병원이 같은 항목을 이름별로 따로 신고한 행. 목록 순서(가격순)를 그대로 둔다. */
  variants: HospitalPrice[];
  minPrice: number;
  maxPrice: number;
};

/** 가격 행을 병원별로 묶는다. 병원 순서는 처음 나온 자리(정렬 기준의 최저·최고가)를 따른다. */
export function groupPricesByHospital(
  rows: readonly HospitalPrice[],
): HospitalPriceGroup[] {
  const groups = new Map<string, HospitalPriceGroup>();
  for (const row of rows) {
    const group = groups.get(row.ykiho);
    if (group) {
      group.variants.push(row);
      group.minPrice = Math.min(group.minPrice, row.price);
      group.maxPrice = Math.max(group.maxPrice, row.price);
      continue;
    }
    groups.set(row.ykiho, {
      ykiho: row.ykiho,
      hospitalName: row.hospitalName,
      className: row.className,
      sidoName: row.sidoName,
      sgguName: row.sgguName,
      variants: [row],
      minPrice: row.price,
      maxPrice: row.price,
    });
  }
  return [...groups.values()];
}
