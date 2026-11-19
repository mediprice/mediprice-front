'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useOptimistic, useRef, useState, useTransition } from 'react';

import { SegmentedControl } from '@/components/ui/segmented-control';
import { AdminPageTitle } from '@/features/admin/components/admin-page-title';
import { QueueList } from '@/features/admin/components/queue-list';
import { ReportDetailDialog } from '@/features/admin/components/report-detail-dialog';
import { ReportRow } from '@/features/admin/components/report-row';
import { ResolveReportDialog } from '@/features/admin/components/resolve-report-dialog';
import {
  adminQueries,
  type AdminReport,
  type ReportAction,
} from '@/features/admin/queries';
import {
  buildReportFiltersQuery,
  REPORT_STATUS_FILTERS,
  type ReportFilters,
} from '@/features/admin/report-filters';

const LIST_HEADING_ID = 'admin-report-list';
const FILTER_LABEL_ID = 'admin-report-filter';

type Notice = { id: number; action: ReportAction };

export function ReportsView({ filters }: { filters: ReportFilters }) {
  const t = useTranslations('admin.reports');
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  /** 서버가 새 searchParams로 다시 그릴 때까지 고른 값을 먼저 보여 주고 바로 불러온다. */
  const [current, setCurrent] = useOptimistic(filters);
  const query = useQuery(adminQueries.reports(current));

  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [action, setAction] = useState<ReportAction>('HIDE_REVIEW');
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  function apply(next: ReportFilters) {
    setNotice(null);
    startTransition(() => {
      setCurrent(next);
      const search = buildReportFiltersQuery(next);
      router.replace(search ? `/admin/reports?${search}` : '/admin/reports', {
        scroll: false,
      });
    });
  }

  function handlePageChange(page: number) {
    apply({ ...current, page });
    document.getElementById(LIST_HEADING_ID)?.focus();
  }

  function handleOpen(report: AdminReport) {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelected(report);
    setDetailOpen(true);
  }

  function handleResolved(report: AdminReport, resolved: ReportAction) {
    setConfirmOpen(false);
    setDetailOpen(false);
    setNotice({ id: report.id, action: resolved });
  }

  /** 처리한 신고가 목록에서 빠지면 연 버튼이 없으므로 목록 제목으로 포커스를 옮긴다. */
  function handleDetailCloseFocus(event: Event) {
    event.preventDefault();
    const opener = openerRef.current;
    if (opener?.isConnected) opener.focus();
    else document.getElementById(LIST_HEADING_ID)?.focus();
  }

  return (
    <>
      <AdminPageTitle title={t('heading')} description={t('description')} />
      <div className="flex flex-col gap-2">
        <p id={FILTER_LABEL_ID} className="text-label-bold">
          {t('filterLabel')}
        </p>
        <SegmentedControl
          name="report-status"
          aria-labelledby={FILTER_LABEL_ID}
          value={current.status}
          options={REPORT_STATUS_FILTERS.map((value) => ({
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
            {t(`resolve.done.${notice.action}`, { id: notice.id })}
          </p>
        )}
        <QueueList
          headingId={LIST_HEADING_ID}
          label={t('listLabel')}
          query={query}
          getKey={(report) => report.id}
          renderItem={(report) => (
            <ReportRow report={report} onOpen={handleOpen} />
          )}
          page={current.page}
          onPageChange={handlePageChange}
          emptyTitle={t(`empty.${current.status}`)}
          loadErrorTitle={t('loadError')}
          isNavigating={isNavigating}
        />
      </div>
      <ReportDetailDialog
        report={selected}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
        onChoose={(next) => {
          setAction(next);
          setConfirmOpen(true);
        }}
        onCloseAutoFocus={handleDetailCloseFocus}
      />
      <ResolveReportDialog
        report={selected}
        action={action}
        open={isConfirmOpen}
        onOpenChange={setConfirmOpen}
        onResolved={handleResolved}
      />
    </>
  );
}
