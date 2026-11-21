import type { ComparisonHospital, ComparisonItem } from './queries';

/** 병원 한 곳이 공개한 세부 항목 하나(이름·가격). */
export type VariantPrice = { name: string; price: number };

export type BasisEntry = {
  ykiho: string;
  price: number;
  /** 이 가격의 세부 항목 이름. 모르면 null이다. */
  variant: string | null;
};

/**
 * 결론을 낼 기준. sameVariant는 모든 병원이 같은 이름으로 공개한 세부 항목끼리, lowest는 병원마다 가장 낮은 공개 가격끼리 견준다.
 * 세부 항목은 병원마다 시간·횟수가 달라 가장 낮은 값끼리는 같은 조건의 비교가 아니다(docs 14장).
 */
export type ComparisonBasis = {
  kind: 'sameVariant' | 'lowest';
  entries: BasisEntry[];
};

const normalizeName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLowerCase();

/** 이름별로 그 병원의 가장 낮은 가격을 남긴다. */
function byName(variants: readonly VariantPrice[]) {
  const map = new Map<string, VariantPrice>();
  for (const variant of variants) {
    const key = normalizeName(variant.name);
    const found = map.get(key);
    if (!found || variant.price < found.price) map.set(key, variant);
  }
  return map;
}

/**
 * 가격을 낸 병원들이 모두 같은 이름의 세부 항목을 공개했으면 그 항목으로(첫 병원의 낮은 가격 순으로 첫 번째), 아니면 병원별 가장 낮은 가격으로 견준다.
 * variants는 hospitals와 같은 순서이고, 아직 모르는 병원은 undefined다.
 */
export function comparisonBasis(
  row: ComparisonItem,
  hospitals: readonly ComparisonHospital[],
  variants: readonly (readonly VariantPrice[] | undefined)[] = [],
): ComparisonBasis {
  const priced = hospitals.flatMap((hospital, index) => {
    const cell = row.prices.find((price) => price.ykiho === hospital.ykiho);
    return cell?.minPrice == null
      ? []
      : [{ ykiho: hospital.ykiho, minPrice: cell.minPrice, index }];
  });
  const maps = priced.map(({ index }) => {
    const list = variants[index];
    return list && list.length > 0 ? byName(list) : null;
  });

  const [firstMap] = maps;
  if (priced.length >= 2 && firstMap && maps.every((map) => map !== null)) {
    const candidates = [...firstMap.entries()].sort(
      ([, a], [, b]) => a.price - b.price,
    );
    const shared = candidates.find(([key]) =>
      maps.every((map) => map?.has(key)),
    );
    if (shared) {
      const [key] = shared;
      return {
        kind: 'sameVariant',
        entries: priced.flatMap(({ ykiho }, index) => {
          const variant = maps[index]?.get(key);
          return variant
            ? [{ ykiho, price: variant.price, variant: variant.name }]
            : [];
        }),
      };
    }
  }

  return {
    kind: 'lowest',
    entries: priced.map(({ ykiho, minPrice, index }) => ({
      ykiho,
      price: minPrice,
      variant:
        variants[index]?.find((variant) => variant.price === minPrice)?.name ??
        null,
    })),
  };
}

/** 기준 가격이 가장 낮은 병원들. 둘 이상이고 서로 다를 때만 고른다. */
export function lowestOf(entries: readonly BasisEntry[]) {
  if (entries.length < 2) return new Set<string>();
  const prices = entries.map((entry) => entry.price);
  const low = Math.min(...prices);
  if (low === Math.max(...prices)) return new Set<string>();
  return new Set(
    entries.filter((entry) => entry.price === low).map((entry) => entry.ykiho),
  );
}

type SummaryBase = { basis: ComparisonBasis['kind']; count: number };

export type CompareSummary =
  | (SummaryBase & {
      kind: 'cheapest';
      ykiho: string;
      name: string;
      price: number;
      /** 이긴 병원의 세부 항목 이름. 모르면 null이다. */
      variant: string | null;
      /** 가장 높은 기준 가격과의 차이. */
      gap: number;
    })
  | (SummaryBase & { kind: 'tie'; tied: number; gap: number })
  | (SummaryBase & { kind: 'same' });

/** 기준 가격으로 머리 문장을 고른다. 가격을 낸 병원이 2곳 미만이면 결론을 내지 않는다(null). */
export function summarizeComparison(
  basis: ComparisonBasis,
  hospitals: readonly ComparisonHospital[],
): CompareSummary | null {
  const entries = basis.entries.filter((entry) =>
    hospitals.some((hospital) => hospital.ykiho === entry.ykiho),
  );
  if (entries.length < 2) return null;
  const prices = entries.map((entry) => entry.price);
  const gap = Math.max(...prices) - Math.min(...prices);
  const base = { basis: basis.kind, count: hospitals.length };
  const lowest = lowestOf(entries);
  if (lowest.size === 0) return { ...base, kind: 'same' };
  if (lowest.size > 1) return { ...base, kind: 'tie', tied: lowest.size, gap };
  const entry = entries.find((e) => lowest.has(e.ykiho));
  const hospital = hospitals.find((h) => h.ykiho === entry?.ykiho);
  if (!entry || !hospital) return null;
  return {
    ...base,
    kind: 'cheapest',
    ykiho: entry.ykiho,
    name: hospital.name,
    price: entry.price,
    variant: entry.variant,
    gap,
  };
}
