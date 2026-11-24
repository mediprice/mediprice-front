import { lastSegment } from '@/features/npay/item-name';
import type { components } from '@/lib/api/schema';

type PriceRow = components['schemas']['HospitalItemPriceResponse'];

export type PriceGroup = { category: string | null; rows: PriceRow[] };

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

/** "도수치료5[1일당]-N 20분"의 마지막 짧은 조각(단위)을 떼어 줄바꿈이 그 사이에서만 일어나게 한다. */
export function splitTrailingUnit(name: string): [string, string] {
  const index = name.trimEnd().lastIndexOf(' ');
  const tail = index > 0 ? name.slice(index + 1).trim() : '';
  if (!tail || tail.length > 8) return [name, ''];
  return [name.slice(0, index + 1), tail];
}

/** 선택 카드의 세부 항목 순서. 값을 훑어보기 쉽게 낮은 가격부터 두고, 같은 값은 받은 순서를 지킨다. */
export function sortVariantRows<R extends Pick<PriceRow, 'price'>>(
  rows: readonly R[],
) {
  return [...rows].sort((a, b) => a.price - b.price);
}

/**
 * 고른 세부 항목(이름·가격)과 맞는 행. 이름과 가격이 모두 맞는 행, 이름만 맞는 행, 맨 앞 행 순서로 찾는다.
 * 목록 행이 보여 준 세부 항목을 병원 화면이 그대로 잇게 한다.
 */
export function pickVariantRow<R extends PriceRow>(
  rows: readonly R[],
  selection: { name: string; price: number | null } | null,
): R | undefined {
  if (selection) {
    const name = selection.name.trim();
    const byName = rows.filter((row) => priceRowName(row) === name);
    const exact = byName.find((row) => row.price === selection.price);
    if (exact ?? byName[0]) return exact ?? byName[0];
  }
  return rows[0];
}

/** 접힌 카드에 보일 세부 항목. 앞에서 limit개를 두되 고른 행이 그 밖에 있으면 마지막 자리를 그 행에 준다. */
export function visibleVariantRows<R>(
  rows: readonly R[],
  active: R | undefined,
  limit: number,
): R[] {
  const head = rows.slice(0, limit);
  if (active === undefined || head.includes(active) || limit < 1) return head;
  return [...head.slice(0, limit - 1), active];
}
