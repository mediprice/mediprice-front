'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { groupHistoryByDay } from '@/features/history/history-groups';
import {
  countHistoryByFilter,
  filterHistory,
  HISTORY_FILTERS,
  type HistoryFilter,
} from '@/features/history/history-target';
import { historyMutations, historyQueries } from '@/features/history/queries';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

import { HistoryEntry } from './history-entry';
import { HistoryListSkeleton } from './history-list-skeleton';

type Notice = { id: number; text: string };

export function HistoryList() {
  const t = useTranslations('library.history');
  const tCommon = useTranslations('common.actions');
  const tErrors = useTranslations('errors');
  const format = useFormatter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const histories = useQuery(historyQueries.list());
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const removeOptions = historyMutations.remove();
  /** 연달아 지우면 mutate별 콜백은 마지막 것만 불리므로 옵션 단계에서 실패를 받는다. 되돌리기는 그대로 둔다. */
  const remove = useMutation({
    ...removeOptions,
    onError: (error, id, result, context) => {
      void removeOptions.onError?.(error, id, result, context);
      setFailure(`${t('removeFailed')} ${tErrors(errorMessageKey(error))}`);
    },
  });
  const clear = useMutation(historyMutations.clear());

  if (histories.isPending) return <HistoryListSkeleton />;

  if (histories.isError) {
    return (
      <EmptyState
        icon={<Clock />}
        title={t('errorTitle')}
        description={tErrors(errorMessageKey(histories.error))}
        action={
          <Button
            variant="tint"
            size="md"
            isLoading={histories.isRefetching}
            onClick={() => void histories.refetch()}
          >
            {tCommon('retry')}
          </Button>
        }
      />
    );
  }

  const entries = histories.data;
  const counts = countHistoryByFilter(entries);
  /** 고른 종류를 모두 지우면 전체로 돌아간다. */
  const activeFilter = counts[filter] > 0 ? filter : 'all';
  const visible = filterHistory(entries, activeFilter);
  const groups = groupHistoryByDay(visible);
  const dayLabel = (group: (typeof groups)[number]) =>
    group.day === 'earlier'
      ? format.dateTime(new Date(`${group.date}T00:00:00+09:00`), {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })
      : t(`day.${group.day}`);
  const filters = HISTORY_FILTERS.filter(
    (value) => value === 'all' || counts[value] > 0,
  );

  function announce(text: string) {
    setNotice((previous) => ({ id: (previous?.id ?? 0) + 1, text }));
  }

  function handleRemove(id: number) {
    setFailure(null);
    remove.mutate(id);
    announce(t('removed'));
    headingRef.current?.focus();
  }

  function handleClear() {
    clear.mutate(undefined, {
      onSuccess: () => {
        setIsConfirming(false);
        setFailure(null);
        announce(t('cleared'));
      },
    });
  }

  return (
    <section aria-labelledby="history-heading">
      <h2
        id="history-heading"
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          'pb-4 text-heading outline-none',
          entries.length === 0 && 'sr-only',
        )}
      >
        {t('listLabel', { count: visible.length })}
      </h2>
      {entries.length === 0 ? (
        <EmptyState
          icon={<Clock />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button asChild variant="tint" size="md">
              <Link href="/">{t('explore')}</Link>
            </Button>
          }
        />
      ) : (
        <>
          {filters.length > 2 && (
            <div
              role="group"
              aria-label={t('filterLabel')}
              className="flex flex-wrap gap-2 pb-5"
            >
              {filters.map((value) => (
                <Chip
                  key={value}
                  selected={value === activeFilter}
                  onClick={() => setFilter(value)}
                >
                  {t('filterCount', {
                    label: t(`filter.${value}`),
                    count: counts[value],
                  })}
                </Chip>
              ))}
            </div>
          )}
          {failure && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-danger-tint px-4 py-3 text-body text-danger"
            >
              {failure}
            </p>
          )}
          <div className="flex flex-col gap-8">
            {groups.map((group) => {
              const label = dayLabel(group);
              return (
                <section
                  key={group.date}
                  aria-labelledby={`history-day-${group.date}`}
                >
                  <h3
                    id={`history-day-${group.date}`}
                    className="pb-2 text-label-bold text-text-secondary"
                  >
                    {label}
                  </h3>
                  <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
                    {group.entries.map((entry) => (
                      <li key={entry.id}>
                        <HistoryEntry
                          entry={entry}
                          onRemove={() => handleRemove(entry.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          <Button
            variant="dangerText"
            size="md"
            onClick={() => {
              clear.reset();
              setIsConfirming(true);
            }}
            className="mt-8 w-full md:w-auto"
          >
            {t('clearAll')}
          </Button>
        </>
      )}
      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title={t('clearDialog.title')}
        description={t('clearDialog.description')}
        cancelLabel={tCommon('cancel')}
        confirmLabel={t('clearDialog.confirm')}
        onConfirm={handleClear}
        isPending={clear.isPending}
        error={clear.isError ? tErrors(errorMessageKey(clear.error)) : null}
        onCloseAutoFocus={(event) => {
          if (!clear.isSuccess) return;
          event.preventDefault();
          headingRef.current?.focus();
        }}
      />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {notice && <p key={notice.id}>{notice.text}</p>}
      </div>
    </section>
  );
}
