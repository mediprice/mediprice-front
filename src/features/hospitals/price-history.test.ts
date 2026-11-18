import { describe, expect, it } from 'vitest';

import { pickSeries, summarizePriceTrend } from './price-history';

const point = (month: string, price: number) => ({ month, price });

describe('summarizePriceTrend', () => {
  it('두 달 미만이면 데이터 부족이다', () => {
    expect(summarizePriceTrend([point('2026-10', 80000)])).toMatchObject({
      kind: 'insufficient',
      points: [{ month: '2026-10', price: 80000 }],
    });
    expect(summarizePriceTrend([]).kind).toBe('insufficient');
  });

  it('오래된 순으로 정렬해 최근 limit개월만 남긴다', () => {
    const summary = summarizePriceTrend(
      [
        point('2026-03', 1),
        point('2026-01', 1),
        point('2026-02', 2),
        point('2026-04', 3),
      ],
      3,
    );

    expect(summary.points.map((p) => p.month)).toEqual([
      '2026-02',
      '2026-03',
      '2026-04',
    ]);
  });

  it('마지막으로 가격이 바뀐 달과 이전 가격, 최저·최고를 구한다', () => {
    const summary = summarizePriceTrend([
      point('2026-06', 70000),
      point('2026-07', 70000),
      point('2026-08', 80000),
      point('2026-09', 80000),
    ]);

    expect(summary).toMatchObject({
      kind: 'trend',
      min: 70000,
      max: 80000,
      latest: { month: '2026-09', price: 80000 },
      lastChange: { since: { month: '2026-08' }, previous: 70000 },
    });
  });

  it('기간 안에 가격이 그대로면 lastChange가 null이다', () => {
    const summary = summarizePriceTrend([
      point('2026-08', 5000),
      point('2026-09', 5000),
    ]);

    expect(summary).toMatchObject({ kind: 'trend', lastChange: null });
  });

  it('형식이 깨진 달은 버린다', () => {
    const summary = summarizePriceTrend([
      point('2026-13', 1),
      point('2026/10', 1),
      point('2026-10', 2),
    ]);

    expect(summary.points.map((p) => p.month)).toEqual(['2026-10']);
  });

  it('달 날짜는 정오(UTC)라 서울 시간으로도 같은 달이다', () => {
    const summary = summarizePriceTrend([point('2026-01', 1)]);

    expect(summary.points[0]?.date.toISOString()).toBe(
      '2026-01-01T12:00:00.000Z',
    );
  });
});

describe('pickSeries', () => {
  const series = [
    { hospitalItemName: '도수치료 20분 ', points: [] },
    { hospitalItemName: '도수치료 40분', points: [] },
  ];

  it('세부 항목 이름이 같은 시리즈를 앞뒤 공백 없이 비교해 고른다', () => {
    expect(pickSeries(series, '도수치료 20분')).toBe(series[0]);
  });

  it('이름 없이 시리즈가 여럿이면 고르지 않고, 하나면 그것을 쓴다', () => {
    expect(pickSeries(series, null)).toBeUndefined();
    expect(pickSeries([series[1]!], null)).toBe(series[1]);
  });
});
