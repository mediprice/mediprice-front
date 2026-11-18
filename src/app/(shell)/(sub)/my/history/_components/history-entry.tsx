import { Building2, ReceiptText, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import {
  historyTargetHref,
  isTargetGone,
} from '@/features/history/history-target';
import type { ViewHistory, ViewTargetType } from '@/features/history/queries';
import { cn } from '@/lib/utils';

const icon = { 'aria-hidden': true, strokeWidth: 1.75 } as const;
const TYPE_ICONS: Record<ViewTargetType, ReactNode> = {
  HOSPITAL: <Building2 {...icon} />,
  NPAY_ITEM: <ReceiptText {...icon} />,
  KEYWORD: <Search {...icon} />,
};

/** 기록 한 줄. 줄 전체가 다시 보기 링크다(제목 링크를 줄 크기로 넓힌다). 삭제는 링크 위에 따로 놓인 아이콘 버튼이다. */
export function HistoryEntry({
  entry,
  onRemove,
}: {
  entry: ViewHistory;
  onRemove: () => void;
}) {
  const t = useTranslations('library.history');
  const href = historyTargetHref(entry);
  const isGone = isTargetGone(entry);
  const title =
    entry.type === 'KEYWORD'
      ? (entry.title ?? entry.targetKey)
      : (entry.title ?? t(`goneTitle.${entry.type}`));

  return (
    <article
      className={cn(
        'relative -mx-3 flex items-center gap-3 rounded-xl py-3.5 pr-1 pl-3 lg:gap-4',
        href &&
          'transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface-strong',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
          isGone
            ? 'bg-surface text-text-tertiary'
            : 'bg-primary-tint text-primary',
        )}
      >
        {TYPE_ICONS[entry.type]}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
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
          {isGone && <StatusChip status="warning">{t('gone')}</StatusChip>}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('removeLabel', { title })}
        onClick={onRemove}
        className="relative z-10 shrink-0 text-text-tertiary hover:bg-danger-tint hover:text-danger active:bg-danger-tint"
      >
        <X aria-hidden="true" />
      </Button>
    </article>
  );
}
