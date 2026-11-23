'use client';

import { useQuery } from '@tanstack/react-query';
import { DatabaseZap, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { adminQueries } from '@/features/admin/queries';

import { AdminQueryError } from './admin-query-error';
import { BatchJobCard } from './batch-job-card';

const HEADING_ID = 'admin-batch-status';

export function BatchStatusPanel() {
  const t = useTranslations('admin.batch');
  const query = useQuery(adminQueries.batchStatus());
  const { data } = query;

  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={HEADING_ID} className="text-section">
            {t('title')}
          </h2>
          <p className="text-body-sm text-text-secondary">{t('description')}</p>
        </div>
        {data && (
          <Button
            variant="outline"
            size="sm"
            isLoading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw aria-hidden="true" />
            {t('refresh')}
          </Button>
        )}
      </div>
      {query.isPending ? (
        <div role="status" className="flex flex-col gap-3">
          <Skeleton className="h-36 w-full rounded-xl" />
          <span className="sr-only">{t('title')}</span>
        </div>
      ) : !data ? (
        <AdminQueryError
          error={query.error}
          title={t('loadError')}
          isRetrying={query.isRefetching}
          onRetry={() => void query.refetch()}
        />
      ) : !data.available ? (
        <EmptyState
          icon={<DatabaseZap />}
          title={t('unavailableTitle')}
          description={t('unavailableDescription')}
        />
      ) : data.jobs.length === 0 ? (
        <EmptyState icon={<DatabaseZap />} title={t('emptyTitle')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.jobs.map((job) => (
            <li key={job.executionId}>
              <BatchJobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
