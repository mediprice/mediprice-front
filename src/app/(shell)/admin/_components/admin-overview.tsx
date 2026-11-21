'use client';

import { useQuery } from '@tanstack/react-query';
import { Flag, Scale } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminClaimQueries } from '@/features/admin/claim-queries';
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
    <article className="flex flex-col gap-3 rounded-xl bg-bg p-5 shadow-card">
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

/** 대기와 기한 지남을 함께 보여 준다. 서버에 기능이 없으면(null) 그 사실만 알린다. */
function PendingClaimsCard() {
  const t = useTranslations('admin.overview');
  const tErrors = useTranslations('errors');
  const pending = useQuery(adminClaimQueries.count('PENDING'));
  const overdue = useQuery(adminClaimQueries.count('EXPIRED_PENDING'));
  const error = pending.error ?? overdue.error;
  const isUnsupported = pending.data === null || overdue.data === null;
  const total = (pending.data ?? 0) + (overdue.data ?? 0);

  return (
    <article className="flex flex-col gap-3 rounded-xl bg-bg p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Scale
          aria-hidden="true"
          className="size-5 text-text-secondary"
          strokeWidth={1.75}
        />
        <h3 className="text-subheading">{t('claimsTitle')}</h3>
      </div>
      {pending.isPending || overdue.isPending ? (
        <Skeleton className="h-8 w-24" />
      ) : error ? (
        <div role="alert" className="flex flex-col gap-0.5 text-body-sm">
          <p className="text-danger">{t('countError')}</p>
          <p className="text-text-secondary">
            {tErrors(errorMessageKey(error))}
          </p>
        </div>
      ) : isUnsupported ? (
        <p className="text-body text-text-secondary">
          {t('claimsUnsupported')}
        </p>
      ) : total === 0 ? (
        <p className="text-title">{t('claimsNone')}</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          <p className="text-title tabular-nums">
            {t('claimsPending', { count: total })}
          </p>
          {(overdue.data ?? 0) > 0 && (
            <p className="text-label-bold text-danger tabular-nums">
              {t('claimsOverdue', { count: overdue.data ?? 0 })}
            </p>
          )}
        </div>
      )}
      {!isUnsupported && (
        <Button
          asChild
          variant={total > 0 ? 'primary' : 'outline'}
          size="md"
          className="self-start"
        >
          <Link
            href={
              (overdue.data ?? 0) > 0
                ? '/admin/claims?status=expired'
                : '/admin/claims'
            }
          >
            {t('openClaims')}
          </Link>
        </Button>
      )}
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
          <PendingClaimsCard />
        </div>
      </section>
      <BatchStatusPanel />
    </>
  );
}
