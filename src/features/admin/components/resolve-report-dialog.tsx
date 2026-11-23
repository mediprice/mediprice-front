'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  adminMutations,
  type AdminReport,
  type ReportAction,
} from '@/features/admin/queries';
import { errorMessageKey } from '@/lib/api/error-message';

const COPY = {
  HIDE_REVIEW: {
    title: 'hideTitle',
    description: 'hideDescription',
    confirm: 'hideConfirm',
  },
  DISMISS: {
    title: 'dismissTitle',
    description: 'dismissDescription',
    confirm: 'dismissConfirm',
  },
} as const;

/** 처리 확인. 낙관적 갱신 없이 성공한 뒤에만 목록을 다시 받고, 다른 운영자가 먼저 처리했으면(409) 그 사실을 다이얼로그 안에서 알린다. */
export function ResolveReportDialog({
  report,
  action,
  open,
  onOpenChange,
  onResolved,
}: {
  report: AdminReport | null;
  action: ReportAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: (report: AdminReport, action: ReportAction) => void;
}) {
  const t = useTranslations('admin.reports.resolve');
  const tErrors = useTranslations('errors');
  const queryClient = useQueryClient();
  const mutation = useMutation(adminMutations.resolveReport(queryClient));
  const copy = COPY[action];

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) mutation.reset();
        onOpenChange(next);
      }}
      title={t(copy.title)}
      description={t(copy.description)}
      cancelLabel={t('cancel')}
      confirmLabel={t(copy.confirm)}
      confirmVariant={action === 'HIDE_REVIEW' ? 'danger' : 'primary'}
      isPending={mutation.isPending}
      error={mutation.isError && tErrors(errorMessageKey(mutation.error))}
      onConfirm={() => {
        if (!report) return;
        mutation.mutate(
          { reportId: report.id, action },
          { onSuccess: () => onResolved(report, action) },
        );
      }}
    />
  );
}
