import type { components } from '@/lib/api/schema';

type Point = components['schemas']['Point'];
type Series = components['schemas']['Series'];

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

type TrendPoint = { month: string; date: Date; price: number };

export type TrendSummary =
  | { kind: 'insufficient'; points: TrendPoint[] }
  | {
      kind: 'trend';
      points: TrendPoint[];
      latest: TrendPoint;
      min: number;
      max: number;
      /** 마지막으로 가격이 바뀐 달과 그 전 가격. 기간 안에 바뀐 적이 없으면 null이다. */
      lastChange: { since: TrendPoint; previous: number } | null;
    };

/** "2026-10"을 그 달 1일 정오(UTC)로 바꿔 어느 시간대로 포맷해도 같은 달이 되게 한다. */
function toTrendPoint(point: Point): TrendPoint | null {
  const match = MONTH.exec(point.month);
  if (!match || !Number.isFinite(point.price)) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, 1, 12),
  );
  return { month: point.month, date, price: point.price };
}

/** 월별 가격을 오래된 순으로 정리해 최근 limit개월만 남기고, 두 달 미만이면 데이터 부족으로 본다. */
export function summarizePriceTrend(
  points: readonly Point[],
  limit = 6,
): TrendSummary {
  const sorted = points
    .map(toTrendPoint)
    .filter((point): point is TrendPoint => point !== null)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-limit);

  const latest = sorted.at(-1);
  if (!latest || sorted.length < 2) {
    return { kind: 'insufficient', points: sorted };
  }

  const prices = sorted.map((point) => point.price);
  let lastChange: { since: TrendPoint; previous: number } | null = null;
  for (let index = sorted.length - 1; index > 0; index -= 1) {
    const current = sorted[index];
    const before = sorted[index - 1];
    if (current && before && current.price !== before.price) {
      lastChange = { since: current, previous: before.price };
      break;
    }
  }

  return {
    kind: 'trend',
    points: sorted,
    latest,
    min: Math.min(...prices),
    max: Math.max(...prices),
    lastChange,
  };
}

/** 세부 항목 이름이 같은 시리즈를 고르고, 이름 없이 시리즈가 하나뿐이면 그것을 쓴다. */
export function pickSeries(
  series: readonly Series[],
  hospitalItemName: string | null | undefined,
): Series | undefined {
  if (hospitalItemName != null) {
    const name = hospitalItemName.trim();
    return series.find((s) => s.hospitalItemName?.trim() === name);
  }
  return series.length === 1 ? series[0] : undefined;
}
