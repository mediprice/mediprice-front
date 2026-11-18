import { useFormatter, useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';

import type { TrendSummary } from '@/features/hospitals/price-history';

type Trend = Extract<TrendSummary, { kind: 'trend' }>;

/** CSSProperties에는 사용자 정의 속성 타입이 없어 런타임 CSS 변수를 넘길 때만 단언한다. */
function cssVars(vars: Record<`--${string}`, string>) {
  return vars as CSSProperties;
}

/** 단일 시리즈 선 차트. 화면 읽기 프로그램에는 같은 값을 표로 준다. */
export function TrendChart({
  summary,
  name,
}: {
  summary: Trend;
  name: string;
}) {
  const t = useTranslations('hospitals.detail.trend');
  const format = useFormatter();
  const { points, min, max, latest } = summary;
  const span = max - min;
  const last = points.length - 1;

  const positions = points.map((point, index) => ({
    point,
    x: (index / last) * 100,
    y: span === 0 ? 50 : ((max - point.price) / span) * 100,
  }));
  const line = positions.map(({ x, y }) => `${x},${y}`).join(' ');
  const monthShort = (date: Date) => format.dateTime(date, { month: 'short' });
  const monthLong = (date: Date) =>
    format.dateTime(date, { year: 'numeric', month: 'long' });
  const first = points[0];

  return (
    <figure className="rounded-lg bg-bg px-3 pt-2 pb-1">
      <figcaption className="sr-only">
        {first &&
          t('chartLabel', {
            name,
            from: monthLong(first.date),
            to: monthLong(latest.date),
            min,
            max,
          })}
      </figcaption>
      <div
        aria-hidden="true"
        className="flex gap-2 text-caption text-text-tertiary tabular-nums"
      >
        <div className="relative h-44 w-14 shrink-0">
          <span className="absolute top-8 right-0 -translate-y-1/2">
            {format.number(max)}
          </span>
          {span > 0 && (
            <span className="absolute right-0 bottom-8 translate-y-1/2">
              {format.number(min)}
            </span>
          )}
        </div>
        <div className="relative h-44 min-w-0 flex-1">
          <div className="absolute inset-x-0 top-8 border-t border-dashed border-border" />
          {span > 0 && (
            <div className="absolute inset-x-0 bottom-8 border-t border-dashed border-border" />
          )}
          <div className="absolute inset-x-4 top-8 bottom-8">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
            >
              <polygon
                points={`0,100 ${line} 100,100`}
                className="fill-primary-tint"
              />
              <polyline
                points={line}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-primary"
              />
            </svg>
            {positions.map(({ point, x, y }, index) => (
              <span
                key={point.month}
                style={cssVars({ '--x': `${x}%`, '--y': `${y}%` })}
                className="group absolute top-(--y) left-(--x) flex size-8 -translate-1/2 items-center justify-center"
              >
                <span
                  className={
                    index === last
                      ? 'size-3 rounded-full bg-primary ring-2 ring-bg'
                      : 'size-2.5 rounded-full border-2 border-primary bg-bg'
                  }
                />
                <span
                  className={
                    index === last
                      ? 'absolute bottom-full text-caption-bold whitespace-nowrap text-text-primary'
                      : 'pointer-events-none absolute bottom-full rounded-md bg-text-primary px-1.5 py-0.5 whitespace-nowrap text-on-primary opacity-0 transition-opacity group-hover:opacity-100'
                  }
                >
                  {t('pointPrice', { price: point.price })}
                </span>
              </span>
            ))}
          </div>
          <div className="absolute inset-x-4 bottom-0 h-6">
            {positions.map(({ point, x }) => (
              <span
                key={point.month}
                style={cssVars({ '--x': `${x}%` })}
                className="absolute top-1 left-(--x) -translate-x-1/2 whitespace-nowrap"
              >
                {monthShort(point.date)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{t('tableCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('month')}</th>
            <th scope="col">{t('price')}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.month}>
              <th scope="row">{monthLong(point.date)}</th>
              <td>{t('pointPrice', { price: point.price })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
