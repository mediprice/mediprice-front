import { useTranslations } from 'next-intl';

import { StatusChip } from '@/components/ui/status-chip';
import type { AdminReport } from '@/features/admin/queries';
import { reportOutcome } from '@/features/admin/report-labels';

/** 대기는 경고(처리할 일), 처리한 신고는 결과 이름과 함께 완료로 보여 준다. */
export function ReportOutcomeChip({ report }: { report: AdminReport }) {
  const t = useTranslations('admin.reports.outcome');
  const outcome = reportOutcome(report);
  return (
    <StatusChip status={outcome === 'pending' ? 'warning' : 'positive'}>
      {t(outcome)}
    </StatusChip>
  );
}
