'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/features/history/components/confirm-dialog';
import {
  countHistoryByFilter,
  filterHistory,
  HISTORY_FILTERS,
  type HistoryFilter,
} from '@/features/history/history-target';
import { historyMutations, historyQueries } from '@/features/history/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { HistoryEntry } from './history-entry';
import { HistoryListSkeleton } from './history-list-skeleton';

type Notice = { id: number; text: string };

export function HistoryList() {
  const t = useTranslations('library.history');
  const tCommon = useTranslations('common.actions');
  const tErrors = useTranslations('errors');
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
            variant="outline"
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
        className="sr-only"
      >
        {t('listLabel', { count: visible.length })}
      </h2>
      {entries.length === 0 ? (
        <EmptyState
          icon={<Clock />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button asChild size="md">
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
              className="flex flex-wrap gap-2 pt-1 pb-3"
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
              className="mb-3 rounded-lg bg-danger-tint px-4 py-3 text-body-sm text-danger"
            >
              {failure}
            </p>
          )}
          <ul className="flex flex-col gap-3 lg:gap-4">
            {visible.map((entry) => (
              <li key={entry.id}>
                <HistoryEntry
                  entry={entry}
                  onRemove={() => handleRemove(entry.id)}
                />
              </li>
            ))}
          </ul>
          <Button
            variant="dangerText"
            size="md"
            onClick={() => {
              clear.reset();
              setIsConfirming(true);
            }}
            className="mt-6 w-full lg:w-auto"
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
