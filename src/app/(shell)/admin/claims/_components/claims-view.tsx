'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleCheck, CloudOff, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useOptimistic, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import type { AdminClaim, ClaimAction } from '@/features/admin/claim-api';
import {
  buildClaimFiltersQuery,
  CLAIM_STATUS_FILTERS,
  type ClaimFilters,
} from '@/features/admin/claim-filters';
import { adminClaimQueries } from '@/features/admin/claim-queries';
import { AdminPageTitle } from '@/features/admin/components/admin-page-title';
import { ClaimDetailDialog } from '@/features/admin/components/claim-detail-dialog';
import { ClaimRow } from '@/features/admin/components/claim-row';
import { QueueList } from '@/features/admin/components/queue-list';
import { isUnsupportedEndpoint } from '@/lib/api/errors';

const LIST_HEADING_ID = 'admin-claim-list';
const FILTER_LABEL_ID = 'admin-claim-filter';

type Notice = { id: number; action: ClaimAction };

export function ClaimsView({ filters }: { filters: ClaimFilters }) {
  const t = useTranslations('admin.claims');
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  /** 서버가 새 searchParams로 다시 그릴 때까지 고른 값을 먼저 보여 주고 바로 불러온다. */
  const [current, setCurrent] = useOptimistic(filters);
  const query = useQuery(adminClaimQueries.list(current));
  const overdue = useQuery(adminClaimQueries.count('EXPIRED_PENDING'));

  const [selected, setSelected] = useState<AdminClaim | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isResolvedRef = useRef(false);

  function apply(next: ClaimFilters) {
    setNotice(null);
    startTransition(() => {
      setCurrent(next);
      const search = buildClaimFiltersQuery(next);
      router.replace(search ? `/admin/claims?${search}` : '/admin/claims', {
        scroll: false,
      });
    });
  }

  function handlePageChange(page: number) {
    apply({ ...current, page });
    document.getElementById(LIST_HEADING_ID)?.focus();
  }

  function handleOpen(claim: AdminClaim) {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    isResolvedRef.current = false;
    setSelected(claim);
    setDetailOpen(true);
  }

  function handleResolved(claim: AdminClaim, action: ClaimAction) {
    isResolvedRef.current = true;
    setDetailOpen(false);
    setNotice({ id: claim.id, action });
  }

  /** 처리한 신고는 다시 받은 목록에서 빠지므로(연 버튼이 사라짐) 목록 제목으로 포커스를 옮긴다. */
  function handleDetailCloseFocus(event: Event) {
    event.preventDefault();
    const opener = openerRef.current;
    if (!isResolvedRef.current && opener?.isConnected) opener.focus();
    else document.getElementById(LIST_HEADING_ID)?.focus();
  }

  if (isUnsupportedEndpoint(query.error)) {
    return (
      <>
        <AdminPageTitle title={t('heading')} description={t('description')} />
        <EmptyState
          icon={<CloudOff />}
          title={t('unsupportedTitle')}
          description={t('unsupportedDescription')}
        />
      </>
    );
  }

  const overdueCount = overdue.data ?? 0;

  return (
    <>
      <AdminPageTitle title={t('heading')} description={t('description')} />
      {overdueCount > 0 && current.status !== 'expired' && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-danger-tint px-4 py-3 text-danger"
        >
          <p className="flex min-w-0 flex-[1_1_16rem] items-start gap-2 text-label-bold">
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-4.5 shrink-0"
              strokeWidth={2}
            />
            {t('overdueNotice', { count: overdueCount })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => apply({ status: 'expired', page: 1 })}
          >
            {t('overdueShow')}
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p id={FILTER_LABEL_ID} className="text-label-bold">
          {t('filterLabel')}
        </p>
        <SegmentedControl
          name="claim-status"
          aria-labelledby={FILTER_LABEL_ID}
          value={current.status}
          options={CLAIM_STATUS_FILTERS.map((value) => ({
            value,
            label: t(`filter.${value}`),
          }))}
          onValueChange={(status) => apply({ status, page: 1 })}
          className="md:max-w-md"
        />
      </div>
      <div className="flex flex-col gap-3">
        {notice && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl bg-positive-tint px-3 py-2.5 text-body-sm text-positive"
          >
            <CircleCheck
              aria-hidden="true"
              className="mt-0.5 size-4.5 shrink-0"
              strokeWidth={1.75}
            />
            {t('resolve.done', {
              id: notice.id,
              action: t(`resolve.actions.${notice.action}`),
            })}
          </p>
        )}
        <QueueList
          headingId={LIST_HEADING_ID}
          label={t('listLabel')}
          query={query}
          getKey={(claim) => claim.id}
          renderItem={(claim) => <ClaimRow claim={claim} onOpen={handleOpen} />}
          page={current.page}
          onPageChange={handlePageChange}
          emptyTitle={t(`empty.${current.status}`)}
          loadErrorTitle={t('loadError')}
          isNavigating={isNavigating}
        />
      </div>
      <ClaimDetailDialog
        claim={selected}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
        onResolved={handleResolved}
        onCloseAutoFocus={handleDetailCloseFocus}
      />
    </>
  );
}
