import type { ComparisonHospital, ComparisonItem } from './queries';

type PriceCell = ComparisonItem['prices'][number];

/** 같은 행에서 가장 낮은 가격(각 병원의 최저가 기준)을 낸 병원들. 가격이 둘 이상이고 서로 다를 때만 표시한다. */
export function findLowest(cells: readonly PriceCell[]) {
  const priced = cells.filter(
    (cell): cell is PriceCell & { minPrice: number } => cell.minPrice != null,
  );
  if (priced.length < 2) return new Set<string>();
  const low = Math.min(...priced.map((cell) => cell.minPrice));
  const high = Math.max(...priced.map((cell) => cell.minPrice));
  if (low === high) return new Set<string>();
  return new Set(
    priced.filter((cell) => cell.minPrice === low).map((cell) => cell.ykiho),
  );
}

/** "제증명수수료/상해진단서/3주 미만"에서 분류 경로를 떼고 "상해진단서 · 3주 미만"으로 읽기 좋게 바꾼다. */
export function formatComparisonItemName({
  itemName,
  categoryName,
}: Pick<ComparisonItem, 'itemName' | 'categoryName'>) {
  const prefix = categoryName ? `${categoryName}/` : '';
  const name =
    prefix && itemName.startsWith(prefix)
      ? itemName.slice(prefix.length)
      : itemName;
  return name
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' · ');
}

export type ItemGroup = { category: string | null; items: ComparisonItem[] };

/** 분류별로 묶되 API 순서를 지키고, 앞에서부터 limit개 항목만 남긴다. */
export function groupComparisonItems(
  items: readonly ComparisonItem[],
  limit = Infinity,
): ItemGroup[] {
  const groups = new Map<string | null, ComparisonItem[]>();
  for (const item of items.slice(0, limit)) {
    const category = item.categoryName?.trim() || null;
    const group = groups.get(category);
    if (group) group.push(item);
    else groups.set(category, [item]);
  }
  return [...groups].map(([category, rows]) => ({ category, items: rows }));
}

/** API는 병원을 정해진 순서로 돌려준다는 보장이 없어 주소(h)의 순서로 다시 맞춘다. */
export function orderHospitals(
  hospitals: readonly ComparisonHospital[],
  ykihos: readonly string[],
) {
  return ykihos.flatMap((ykiho) => {
    const hospital = hospitals.find((h) => h.ykiho === ykiho);
    return hospital ? [hospital] : [];
  });
}

/** 세부 항목마다 적용일이 다를 수 있어 가장 최근 날짜를 고른다(ISO 날짜라 문자열로 비교한다). */
export function latestDate(dates: readonly (string | null | undefined)[]) {
  let latest: string | null = null;
  for (const date of dates) {
    if (date && (!latest || date > latest)) latest = date;
  }
  return latest;
}
