import type { components } from '@/lib/api/schema';

type PriceRow = components['schemas']['HospitalItemPriceResponse'];

export type PriceGroup = { category: string | null; rows: PriceRow[] };

/** "예방접종료/대상포진/스카이조스터주"처럼 분류 경로가 붙은 표준 이름의 마지막 조각. */
export function lastSegment(name: string) {
  const parts = name.split('/').map((part) => part.trim());
  return parts.findLast((part) => part !== '') ?? name.trim();
}

/** 목록에 보일 이름. 병원이 붙인 세부 이름을 먼저 쓰고, 없으면 표준 이름의 마지막 조각을 쓴다. */
export function priceRowName(row: PriceRow) {
  return row.hospitalItemName?.trim() || lastSegment(row.itemName);
}

function rowKey(row: PriceRow) {
  return `${row.npayCode}|${priceRowName(row)}|${row.price}`;
}

/** 분류별로 묶되 처음 나온 순서를 지키고, 선택한 항목의 분류를 맨 앞에 두고 그 항목 행을 위로 올린다. */
export function groupPriceRows(
  rows: readonly PriceRow[],
  selected?: { npayCode: string; rows: readonly PriceRow[] } | null,
): PriceGroup[] {
  const pinned = selected
    ? [
        ...selected.rows,
        ...rows.filter((row) => row.npayCode === selected.npayCode),
      ]
    : [];
  const seen = new Set<string>();
  const ordered = [...pinned, ...rows].filter((row) => {
    const key = rowKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const groups = new Map<string | null, PriceRow[]>();
  for (const row of ordered) {
    const category = row.categoryName?.trim() || null;
    const group = groups.get(category);
    if (group) group.push(row);
    else groups.set(category, [row]);
  }
  return [...groups].map(([category, groupRows]) => ({
    category,
    rows: groupRows,
  }));
}
