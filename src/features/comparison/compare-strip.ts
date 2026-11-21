import { type ComparisonBasis, lowestOf } from './compare-basis';
import type { ComparisonHospital } from './queries';

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

export type StripMarker = {
  id: string;
  /** 표 머리와 같은 순번(1부터). */
  number: number;
  value: number;
  isLowest: boolean;
};

/** 기준 가격의 병원별 점. 가격이 없는 병원은 빼고, 번호는 열 순서를 그대로 쓴다. */
export function stripMarkers(
  basis: ComparisonBasis,
  hospitals: readonly ComparisonHospital[],
): StripMarker[] {
  const lowest = lowestOf(basis.entries);
  return hospitals.flatMap((hospital, index) => {
    const entry = basis.entries.find((e) => e.ykiho === hospital.ykiho);
    return entry
      ? [
          {
            id: hospital.ykiho,
            number: index + 1,
            value: entry.price,
            isLowest: lowest.has(hospital.ykiho),
          },
        ]
      : [];
  });
}

export type StripCluster = {
  id: string;
  numbers: number[];
  /** 막대 위 자리(0–1). 묶인 점들의 가운데다. */
  position: number;
  isLowest: boolean;
};

/**
 * 가까운 점(minGap 미만, 0–1)은 "2·3"처럼 번호를 합친 점 하나로 묶는다. 위로 쌓지 않아 막대 하나에 한 줄로 읽힌다.
 * 묶은 뒤 가운데끼리 다시 가까우면 또 묶는다. positions는 markers와 같은 순서다.
 */
export function clusterStripMarkers(
  markers: readonly StripMarker[],
  positions: readonly number[],
  minGap: number,
): StripCluster[] {
  type Draft = { members: { marker: StripMarker; position: number }[] };
  const center = (draft: Draft) =>
    draft.members.reduce((sum, m) => sum + m.position, 0) /
    draft.members.length;
  let drafts: Draft[] = markers
    .map((marker, index) => ({ marker, position: positions[index] ?? 0.5 }))
    .sort(
      (a, b) => a.position - b.position || a.marker.number - b.marker.number,
    )
    .map((member) => ({ members: [member] }));

  let merged = true;
  while (merged) {
    merged = false;
    const next: Draft[] = [];
    for (const draft of drafts) {
      const last = next.at(-1);
      if (last && center(draft) - center(last) < minGap) {
        last.members.push(...draft.members);
        merged = true;
      } else {
        next.push({ members: [...draft.members] });
      }
    }
    drafts = next;
  }

  return drafts.map((draft) => {
    const numbers = draft.members
      .map((member) => member.marker.number)
      .sort((a, b) => a - b);
    const first = draft.members.find(
      (member) => member.marker.number === numbers[0],
    );
    return {
      id: first?.marker.id ?? '',
      numbers,
      position: center(draft),
      isLowest: draft.members.some((member) => member.marker.isLowest),
    };
  });
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
