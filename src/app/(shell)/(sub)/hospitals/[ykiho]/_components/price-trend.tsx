'use client';

import { ChevronDown } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { StatusChip } from '@/components/ui/status-chip';
import type { TrendSummary } from '@/features/hospitals/price-history';

import { TrendChart } from './trend-chart';

type Trend = Extract<TrendSummary, { kind: 'trend' }>;

/** 두 달 이상 기록이 있을 때만 뜨는 가격 추이 카드. 기본으로 펼쳐 둔다. */
export function PriceTrend({
  summary,
  name,
}: {
  summary: Trend;
  name: string;
}) {
  const t = useTranslations('hospitals.detail.trend');
  const format = useFormatter();
  const panelId = useId();
  const [isExpanded, setIsExpanded] = useState(true);
  const { lastChange, latest } = summary;
  const direction = !lastChange
    ? 'same'
    : latest.price > lastChange.previous
      ? 'up'
      : 'down';

  return (
    <section
      aria-label={t('label')}
      className="flex flex-col gap-3 rounded-xl bg-surface px-5 py-4 lg:px-6 lg:py-5"
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => setIsExpanded((value) => !value)}
        className="-mx-2 -my-1 flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-1 text-left hover:bg-surface-strong"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-caption text-text-secondary">{t('label')}</span>
          <span className="text-body-lg text-text-primary">
            {t('title', { count: summary.points.length })}
          </span>
        </span>
        <span className="sr-only">
          {isExpanded ? t('collapse') : t('expand')}
        </span>
        <ChevronDown
          aria-hidden="true"
          data-expanded={isExpanded}
          className="size-5 shrink-0 text-text-secondary transition-transform duration-150 ease-standard data-[expanded=true]:rotate-180"
          strokeWidth={1.75}
        />
      </button>
      <div id={panelId} hidden={!isExpanded}>
        <TrendChart summary={summary} name={name} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip status={direction === 'up' ? 'warning' : 'positive'}>
          {t(direction)}
        </StatusChip>
        <p className="text-body-sm text-text-secondary tabular-nums">
          {lastChange
            ? t('changed', {
                month: format.dateTime(lastChange.since.date, {
                  year: 'numeric',
                  month: 'long',
                }),
                price: latest.price,
                previous: lastChange.previous,
              })
            : t('unchanged', { price: latest.price })}
        </p>
      </div>
    </section>
  );
}
