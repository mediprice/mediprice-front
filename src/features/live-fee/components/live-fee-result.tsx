'use client';

import { Info, SearchX } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { PriceRange } from '@/components/ui/price-range';
import { StatusChip } from '@/components/ui/status-chip';
import type { LiveFeeItem, LiveFeeResponse } from '@/features/live-fee/schemas';
import {
  itemVerdict,
  parsePublishedMonth,
  summarizeVerdict,
} from '@/features/live-fee/verdict';
import { lastSegment } from '@/features/npay/item-name';
import { cn } from '@/lib/utils';

/** 누리집 가격은 참고용이라 단정하지 않고, 앱 가격과 나란히 두고 출처와 확인 시각을 함께 보여 준다. */
export function LiveFeeResult({
  result,
  className,
}: {
  result: LiveFeeResponse;
  className?: string;
}) {
  const t = useTranslations('liveFee.result');
  const format = useFormatter();
  const verdict = summarizeVerdict(result.items);
  const showNames = result.items.length > 1;

  return (
    <div
      data-slot="live-fee-result"
      className={cn('flex flex-col gap-3', className)}
    >
      {verdict === 'none' ? (
        <p className="flex items-center gap-2 text-label-bold text-text-primary">
          <SearchX
            aria-hidden="true"
            className="size-4 shrink-0 text-text-secondary"
            strokeWidth={1.75}
          />
          {t('none')}
        </p>
      ) : (
        <StatusChip status={verdict === 'same' ? 'positive' : 'warning'}>
          {t(verdict)}
        </StatusChip>
      )}

      {result.items.length > 0 && (
        <ul className="flex flex-col">
          {result.items.map((item) => (
            <li
              key={item.code}
              className="flex flex-col gap-1 border-b border-hairline py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              {showNames && (
                <p className="text-label-bold text-text-primary">
                  {lastSegment(item.name)}
                </p>
              )}
              <PriceRow label={t('ourPrice')}>
                <PriceRange min={item.dbMinPrice} max={item.dbMaxPrice} />
              </PriceRow>
              <PriceRow label={t('webPrice')} note={publishedNote(item)}>
                {itemVerdict(item) === 'none' ? (
                  <span className="text-text-tertiary">{t('notListed')}</span>
                ) : (
                  <PriceRange min={item.webMinPrice} max={item.webMaxPrice} />
                )}
              </PriceRow>
            </li>
          ))}
        </ul>
      )}

      {verdict !== 'same' && (
        <p className="text-body-sm text-text-secondary">
          {verdict === 'changed' ? t('changedNote') : t('noneNote')}
        </p>
      )}
      {verdict !== 'none' && (
        <p className="text-body-sm text-text-secondary">{t('disclaimer')}</p>
      )}
      <p className="flex items-start gap-1.5 text-caption text-text-tertiary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0"
          strokeWidth={1.5}
        />
        {t('source', {
          time: format.dateTime(new Date(result.fetchedAt), 'dateTime'),
        })}
      </p>
    </div>
  );

  function publishedNote(item: LiveFeeItem) {
    const month = parsePublishedMonth(item.webPublishedMonth);
    return month
      ? t('publishedMonth', {
          month: format.dateTime(month, { year: 'numeric', month: 'long' }),
        })
      : null;
  }
}

/** 좁은 화면에서 가격 범위가 길면 가격만 다음 줄 오른쪽으로 내린다. */
function PriceRow({
  label,
  note,
  children,
}: {
  label: string;
  note?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-body-sm">
      <span className="flex flex-col text-text-secondary">
        {label}
        {note && (
          <span className="text-caption text-text-tertiary">{note}</span>
        )}
      </span>
      <span className="ml-auto text-right text-label-bold text-text-primary tabular-nums">
        {children}
      </span>
    </div>
  );
}
