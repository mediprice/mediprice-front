import { ChevronRight, X } from 'lucide-react';
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

/** 줄 전체가 다시 보기 링크다(제목 링크를 카드 크기로 넓힌다). 삭제는 링크 위에 따로 놓인 아이콘 버튼이다. */
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
        'relative flex items-start gap-2 rounded-xl py-4 pr-1 pl-4 lg:items-center lg:gap-4 lg:py-5 lg:pr-3 lg:pl-6',
        href
          ? 'bg-bg shadow-card transition-shadow duration-150 ease-standard has-[a:hover]:shadow-float'
          : 'border border-hairline bg-surface',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3
          className={cn(
            'text-subheading break-all',
            isGone && 'text-text-secondary',
          )}
        >
          {href ? (
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:rounded-xl"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-text-secondary">
          <span>{t(`type.${entry.type}`)}</span>
          <span aria-hidden="true" className="text-text-tertiary lg:hidden">
            ·
          </span>
          <span className="text-text-tertiary tabular-nums lg:hidden">
            {viewedAt}
          </span>
          {isGone && <StatusChip status="warning">{t('gone')}</StatusChip>}
        </p>
      </div>
      <span className="hidden shrink-0 text-body-sm text-text-tertiary tabular-nums lg:block">
        {viewedAt}
      </span>
      {href && (
        <span
          aria-hidden="true"
          className="hidden w-22 shrink-0 items-center justify-end gap-0.5 text-label-bold text-primary-text lg:inline-flex"
        >
          {t('revisit')}
          <ChevronRight className="size-4" strokeWidth={2} />
        </span>
      )}
      {!href && <span aria-hidden="true" className="hidden w-22 lg:block" />}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('removeLabel', { title })}
        onClick={onRemove}
        className="relative z-10 -my-2.5 shrink-0 text-text-tertiary hover:bg-danger-tint hover:text-danger active:bg-danger-tint lg:my-0"
      >
        <X aria-hidden="true" />
      </Button>
    </article>
  );
}
