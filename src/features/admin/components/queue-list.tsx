'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Key, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessageKey } from '@/lib/api/error-message';
import { cn } from '@/lib/utils';

import { AdminQueryError } from './admin-query-error';
import { QueuePagination } from './queue-pagination';

/** 백엔드 PageResponse 모양. 신고·권리침해 신고 같은 대기열이 같은 목록을 쓴다. */
export type QueuePage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
};

/** 처리 대기열 한 페이지. 행 모양과 문구만 대기열마다 넘기고, 불러오기·빈 상태·오류·페이지 이동은 여기서 맡는다. */
export function QueueList<T>({
  headingId,
  label,
  query,
  getKey,
  renderItem,
  page,
  onPageChange,
  emptyTitle,
  loadErrorTitle,
  isNavigating = false,
}: {
  headingId: string;
  label: string;
  query: UseQueryResult<QueuePage<T>>;
  getKey: (item: T) => Key;
  renderItem: (item: T) => ReactNode;
  /** 1부터 센다. */
  page: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  loadErrorTitle: string;
  /** URL을 바꾸는 중(필터·페이지 이동). */
  isNavigating?: boolean;
}) {
  const t = useTranslations('admin.queue');
  const tErrors = useTranslations('errors');
  const { data } = query;

  if (query.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <Skeleton className="h-6 w-24" />
        <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-2.5 py-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <AdminQueryError
        error={query.error}
        title={loadErrorTitle}
        isRetrying={query.isRefetching}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (data.content.length === 0) {
    if (page > 1) {
      return (
        <EmptyState
          icon={<Inbox />}
          title={t('pageOutOfRangeTitle')}
          description={t('pageOutOfRangeDescription')}
          action={
            <Button variant="tint" size="md" onClick={() => onPageChange(1)}>
              {t('firstPage')}
            </Button>
          }
        />
      );
    }
    return <EmptyState icon={<Inbox />} title={emptyTitle} />;
  }

  const isUpdating = isNavigating || query.isPlaceholderData;

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={isUpdating || undefined}
      className="flex flex-col gap-3"
    >
      <h2
        id={headingId}
        tabIndex={-1}
        className="text-heading tabular-nums outline-none"
      >
        <span className="sr-only">{label}</span>
        {t('count', { count: data.totalElements })}
      </h2>
      {query.isError && (
        <p role="alert" className="text-body-sm text-danger">
          {tErrors(errorMessageKey(query.error))}
        </p>
      )}
      <ul
        className={cn(
          'flex flex-col divide-y divide-hairline border-y border-hairline transition-opacity duration-200 ease-standard',
          isUpdating && 'opacity-60',
        )}
      >
        {data.content.map((item) => (
          <li key={getKey(item)}>{renderItem(item)}</li>
        ))}
      </ul>
      {data.totalPages > 1 && (
        <QueuePagination
          page={page}
          totalPages={data.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
}
