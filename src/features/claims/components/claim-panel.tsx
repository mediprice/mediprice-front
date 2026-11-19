'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleAlert, Info } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessageKey } from '@/lib/api/error-message';

import type { ClaimReceipt as Receipt } from '../api';
import { claimNoticeState, claimQueries } from '../queries';
import { ClaimForm } from './claim-form';
import { ClaimReceipt } from './claim-receipt';

/** 접수 가능 여부를 먼저 확인한다. 서버에 기능이 없거나 접수가 멈췄거나 안내문 버전이 다르면 양식을 보이되 막는다. */
export function ClaimPanel<T extends string>({
  reviewId,
  backHref,
}: {
  reviewId: number;
  backHref: Route<T>;
}) {
  const t = useTranslations('claims.status');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const notice = useQuery(claimQueries.notice());
  const [result, setResult] = useState<{
    receipt: Receipt;
    email: string;
  } | null>(null);

  if (result) {
    return (
      <ClaimReceipt
        receipt={result.receipt}
        email={result.email}
        backHref={backHref}
      />
    );
  }

  if (notice.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <span className="sr-only">{t('checking')}</span>
      </div>
    );
  }

  if (notice.isError) {
    return (
      <EmptyState
        icon={<CircleAlert />}
        title={t('loadError')}
        description={tErrors(errorMessageKey(notice.error))}
        action={
          <Button
            variant="tint"
            size="md"
            isLoading={notice.isRefetching}
            onClick={() => void notice.refetch()}
          >
            {tActions('retry')}
          </Button>
        }
      />
    );
  }

  const isClosed = claimNoticeState(notice.data) !== 'open';

  return (
    <div className="flex flex-col gap-6">
      {isClosed && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl bg-warning-tint px-4 py-3 text-warning"
        >
          <Info
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
            strokeWidth={1.75}
          />
          <div className="flex flex-col gap-1">
            <p className="text-label-bold">{t('closedTitle')}</p>
            <p className="text-body-sm">{t('closedDescription')}</p>
            <Link
              href="/policy/reviews#reporting"
              className="inline-flex min-h-11 w-fit items-center text-body-sm underline underline-offset-4 hover:decoration-2"
            >
              {t('policyLink')}
            </Link>
          </div>
        </div>
      )}
      <ClaimForm
        reviewId={reviewId}
        isClosed={isClosed}
        onSubmitted={(receipt, email) => setResult({ receipt, email })}
      />
    </div>
  );
}
