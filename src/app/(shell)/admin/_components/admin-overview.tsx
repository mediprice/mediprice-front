'use client';

import { useQuery } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageTitle } from '@/features/admin/components/admin-page-title';
import { BatchStatusPanel } from '@/features/admin/components/batch-status-panel';
import { adminQueries } from '@/features/admin/queries';
import { errorMessageKey } from '@/lib/api/error-message';

const QUEUES_HEADING_ID = 'admin-queues';

function PendingReportsCard() {
  const t = useTranslations('admin.overview');
  const tErrors = useTranslations('errors');
  const count = useQuery(adminQueries.pendingCount());

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-surface p-5">
      <div className="flex items-center gap-2">
        <Flag
          aria-hidden="true"
          className="size-5 text-text-secondary"
          strokeWidth={1.75}
        />
        <h3 className="text-subheading">{t('reportsTitle')}</h3>
      </div>
      {count.isPending ? (
        <Skeleton className="h-8 w-24" />
      ) : count.isError ? (
        <div role="alert" className="flex flex-col gap-0.5 text-body-sm">
          <p className="text-danger">{t('countError')}</p>
          <p className="text-text-secondary">
            {tErrors(errorMessageKey(count.error))}
          </p>
        </div>
      ) : (
        <p className="text-title tabular-nums">
          {count.data > 0
            ? t('pendingCount', { count: count.data })
            : t('pendingNone')}
        </p>
      )}
      <Button
        asChild
        variant={count.data ? 'primary' : 'outline'}
        size="md"
        className="self-start"
      >
        <Link href="/admin/reports">{t('openReports')}</Link>
      </Button>
    </article>
  );
}

export function AdminOverview() {
  const t = useTranslations('admin.overview');
  return (
    <>
      <AdminPageTitle title={t('heading')} description={t('description')} />
      <section
        aria-labelledby={QUEUES_HEADING_ID}
        className="flex flex-col gap-3"
      >
        <h2 id={QUEUES_HEADING_ID} className="text-section">
          {t('queues')}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <PendingReportsCard />
        </div>
      </section>
      <BatchStatusPanel />
    </>
  );
}
