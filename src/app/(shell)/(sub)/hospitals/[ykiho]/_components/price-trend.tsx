'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  pickSeries,
  summarizePriceTrend,
  type TrendSummary,
} from '@/features/hospitals/price-history';
import { hospitalQueries } from '@/features/hospitals/queries';

import { SectionError } from './section-error';
import { TrendChart } from './trend-chart';

export function PriceTrend({
  ykiho,
  item,
  variant,
}: {
  ykiho: string;
  item: string;
  variant: string | null;
}) {
  const t = useTranslations('hospitals.detail.trend');
  const format = useFormatter();
  const panelId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const history = useQuery(
    hospitalQueries.priceHistory(ykiho, { npayCode: item }),
  );

  const series = history.data
    ? pickSeries(history.data.series, variant)
    : undefined;
  const summary = series ? summarizePriceTrend(series.points) : undefined;
  const monthLabel = (date: Date) =>
    format.dateTime(date, { year: 'numeric', month: 'long' });

  function describe(trend: TrendSummary) {
    if (trend.kind === 'insufficient') {
      const only = trend.points.at(-1);
      return only
        ? t('single', { month: monthLabel(only.date), price: only.price })
        : t('insufficient');
    }
    return trend.lastChange
      ? t('changed', {
          month: monthLabel(trend.lastChange.since.date),
          price: trend.latest.price,
          previous: trend.lastChange.previous,
        })
      : t('unchanged', { price: trend.latest.price });
  }

  const heading = (
    <span className="flex min-w-0 flex-col gap-1 text-left">
      <span className="text-caption text-text-secondary">{t('label')}</span>
      <span className="text-body-lg text-text-primary">
        {summary && summary.points.length > 0
          ? t('title', { count: summary.points.length })
          : t('titleEmpty')}
      </span>
    </span>
  );

  return (
    <section
      aria-label={t('label')}
      className="flex flex-col gap-3 rounded-xl bg-surface px-5 py-4 lg:px-6 lg:py-5"
    >
      {history.isPending ? (
        <div className="flex flex-col gap-2 py-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
      ) : history.isError ? (
        <>
          {heading}
          <SectionError
            error={history.error}
            onRetry={() => void history.refetch()}
            className="bg-bg"
          />
        </>
      ) : !series || !summary ? (
        <>
          {heading}
          <p className="text-body-sm text-text-secondary">
            {variant == null && history.data.series.length > 1
              ? t('chooseVariant')
              : t('insufficient')}
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            onClick={() => setIsExpanded((value) => !value)}
            className="-mx-2 -my-1 flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-1 hover:bg-surface-strong"
          >
            {heading}
            <span className="sr-only">
              {isExpanded ? t('collapse') : t('expand')}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-text-secondary transition-transform duration-150 ease-standard data-[expanded=true]:rotate-180"
              data-expanded={isExpanded}
              strokeWidth={1.75}
            />
          </button>
          <div id={panelId} hidden={!isExpanded}>
            {summary.kind === 'trend' ? (
              <TrendChart
                summary={summary}
                name={series.hospitalItemName ?? variant ?? item}
              />
            ) : (
              <p className="rounded-lg bg-bg px-4 py-8 text-center text-body-sm text-text-secondary">
                {t('insufficient')}
              </p>
            )}
          </div>
          <p className="text-body-sm text-text-secondary tabular-nums">
            {describe(summary)}
          </p>
        </>
      )}
    </section>
  );
}
