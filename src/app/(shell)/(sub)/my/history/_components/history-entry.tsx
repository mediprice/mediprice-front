import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import {
  historyTargetHref,
  isTargetGone,
} from '@/features/history/history-target';
import type { ViewHistory } from '@/features/history/queries';
import { cn } from '@/lib/utils';

/** 모바일은 아래에 삭제·다시 보기를 반씩 나눈 카드, 데스크톱은 한 줄(날짜·다시 보기·삭제)이다. */
export function HistoryEntry({
  entry,
  onRemove,
}: {
  entry: ViewHistory;
  onRemove: () => void;
}) {
  const t = useTranslations('library.history');
  const format = useFormatter();
  const href = historyTargetHref(entry);
  const isGone = isTargetGone(entry);
  const title =
    entry.type === 'KEYWORD'
      ? (entry.title ?? entry.targetKey)
      : (entry.title ?? t(`goneTitle.${entry.type}`));
  const viewedAt = (
    <time dateTime={entry.viewedAt}>
      {format.dateTime(new Date(entry.viewedAt), 'dateShort')}
    </time>
  );

  return (
    <article
      className={cn(
        'flex flex-col rounded-xl shadow-card lg:flex-row lg:items-center lg:gap-4 lg:py-4 lg:pr-4 lg:pl-6',
        isGone ? 'bg-surface' : 'bg-bg',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 pt-4 pb-3 lg:p-0">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              'min-w-0 text-subheading break-all',
              isGone && 'text-text-secondary',
            )}
          >
            {title}
          </h3>
          <span className="shrink-0 pt-0.5 text-caption text-text-tertiary tabular-nums lg:hidden">
            {viewedAt}
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-2 text-body-sm text-text-secondary">
          {t(`type.${entry.type}`)}
          {isGone && <StatusChip status="warning">{t('gone')}</StatusChip>}
        </p>
      </div>
      <span className="hidden shrink-0 text-body-sm text-text-tertiary tabular-nums lg:block">
        {viewedAt}
      </span>
      <div className="grid grid-cols-2 divide-x divide-hairline border-t border-hairline lg:flex lg:shrink-0 lg:gap-2 lg:divide-x-0 lg:border-t-0">
        {href && (
          <Button
            asChild
            variant="ghost"
            size="md"
            className="order-last rounded-none rounded-br-xl lg:order-first lg:rounded-lg lg:bg-primary-tint lg:hover:bg-primary-tint-hover"
          >
            <Link href={href} aria-label={t('revisitLabel', { title })}>
              {t('revisit')}
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="md"
          aria-label={t('removeLabel', { title })}
          onClick={onRemove}
          className={cn(
            'rounded-none rounded-bl-xl text-danger hover:bg-danger-tint active:bg-danger-tint lg:rounded-lg',
            !href && 'col-span-2 rounded-br-xl',
          )}
        >
          {t('remove')}
        </Button>
      </div>
    </article>
  );
}
