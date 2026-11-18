import { findLowest } from './compare-rows';
import type { ComparisonHospital, ComparisonItem } from './queries';

export type StripDomain = { min: number; max: number };

/** 비교 막대의 양 끝. 지역 범위가 있으면 그 범위에 비교 병원 값을 더해 넓히고, 없으면 병원 값만 쓴다. 폭이 없으면 null이다. */
export function stripDomain(
  values: readonly (number | null | undefined)[],
  range?: {
    min: number | null | undefined;
    max: number | null | undefined;
  } | null,
): StripDomain | null {
  const all = [...values, range?.min, range?.max].filter(
    (value): value is number => value != null && Number.isFinite(value),
  );
  if (all.length === 0) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  return max > min ? { min, max } : null;
}

/**
 * 가까운 점끼리 겹치지 않게 줄(lane)을 나눈다. 낮은 값부터 놓으며 앞 점과 minGap(0–1) 이상 떨어진 가장 낮은 줄에 넣는다.
 * 돌려주는 배열은 입력 순서와 같다.
 */
export function assignLanes(positions: readonly number[], minGap: number) {
  const order = positions
    .map((position, index) => ({ position, index }))
    .sort((a, b) => a.position - b.position || a.index - b.index);
  const laneEnds: number[] = [];
  const lanes = new Array<number>(positions.length).fill(0);
  for (const { position, index } of order) {
    let lane = laneEnds.findIndex((end) => position - end >= minGap);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = position;
    lanes[index] = lane;
  }
  return lanes;
}

export type StripMarker = {
  id: string;
  /** 표 머리와 같은 순번(1부터). */
  number: number;
  value: number;
  isLowest: boolean;
};

/** 한 항목 줄의 병원별 점. 가격이 없는 병원은 빼고, 번호는 열 순서를 그대로 쓴다. */
export function stripMarkers(
  row: ComparisonItem,
  hospitals: readonly ComparisonHospital[],
): StripMarker[] {
  const cells = hospitals.map((hospital) =>
    row.prices.find((price) => price.ykiho === hospital.ykiho),
  );
  const lowest = findLowest(cells.filter((cell) => cell != null));
  return hospitals.flatMap((hospital, index) => {
    const value = cells[index]?.minPrice;
    return value == null
      ? []
      : [
          {
            id: hospital.ykiho,
            number: index + 1,
            value,
            isLowest: lowest.has(hospital.ykiho),
          },
        ];
  });
}

export type StripGroup = {
  id: string;
  numbers: number[];
  value: number;
  isLowest: boolean;
};

/** 같은 값의 점은 하나로 합쳐 "2·3"처럼 번호를 함께 쓴다. 첫 등장 순서를 지킨다. */
export function groupStripMarkers(
  markers: readonly StripMarker[],
): StripGroup[] {
  const groups = new Map<number, StripGroup>();
  for (const marker of markers) {
    const group = groups.get(marker.value);
    if (group) {
      group.numbers.push(marker.number);
      group.isLowest ||= marker.isLowest;
    } else {
      groups.set(marker.value, {
        id: marker.id,
        numbers: [marker.number],
        value: marker.value,
        isLowest: marker.isLowest,
      });
    }
  }
  return [...groups.values()];
}

/** 표 행의 작은 막대. 가격을 낸 병원이 둘 이상이고 값이 서로 다를 때만 그린다. */
export function rowStrip(
  row: ComparisonItem,
  hospitals: readonly ComparisonHospital[],
) {
  const markers = stripMarkers(row, hospitals);
  const domain = stripDomain(markers.map((marker) => marker.value));
  return markers.length >= 2 && domain ? { domain, markers } : null;
}

export type CompareSummary =
  | {
      kind: 'cheapest';
      count: number;
      ykiho: string;
      name: string;
      price: number;
      /** 가장 높은 최저가와의 차이. */
      gap: number;
    }
  | { kind: 'tie'; count: number; tied: number; price: number; gap: number }
  | { kind: 'same'; count: number; price: number };

/** 선택 항목 한 줄로 머리 문장을 고른다. 가격을 낸 병원이 2곳 미만이면 결론을 내지 않는다(null). */
export function summarizeComparison(
  row: ComparisonItem,
  hospitals: readonly ComparisonHospital[],
): CompareSummary | null {
  const cells = row.prices.filter(
    (cell) =>
      cell.minPrice != null &&
      hospitals.some((hospital) => hospital.ykiho === cell.ykiho),
  );
  if (cells.length < 2) return null;
  const prices = cells.map((cell) => cell.minPrice ?? 0);
  const price = Math.min(...prices);
  const gap = Math.max(...prices) - price;
  const count = hospitals.length;
  const lowest = findLowest(cells);
  if (lowest.size === 0) return { kind: 'same', count, price };
  if (lowest.size > 1) {
    return { kind: 'tie', count, tied: lowest.size, price, gap };
  }
  const [ykiho] = [...lowest];
  const hospital = hospitals.find((h) => h.ykiho === ykiho);
  if (!ykiho || !hospital) return null;
  return { kind: 'cheapest', count, ykiho, name: hospital.name, price, gap };
}

export type SubjectParticle = 'consonant' | 'vowel' | 'unknown';

/** 숫자를 한국어로 읽었을 때 받침이 있는지(0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔). */
const DIGIT_HAS_FINAL = new Set(['0', '1', '3', '6', '7', '8']);

/**
 * 이름 뒤 주격 조사(이/가)를 고르는 기준. 끝의 괄호 덧말("(강남점)")은 빼고 마지막 글자의 받침을 본다.
 * 한글·숫자가 아니면 unknown이고 메시지는 "이(가)"로 쓴다.
 */
export function subjectParticle(name: string): SubjectParticle {
  const base = name.replace(/\s*[([][^)\]]*[)\]]\s*$/, '').trim();
  const last = base.at(-1);
  if (!last) return 'unknown';
  if (/[0-9]/.test(last)) {
    return DIGIT_HAS_FINAL.has(last) ? 'consonant' : 'vowel';
  }
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return 'unknown';
  return (code - 0xac00) % 28 === 0 ? 'vowel' : 'consonant';
}
