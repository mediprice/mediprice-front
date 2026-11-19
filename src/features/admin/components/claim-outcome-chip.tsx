import { useTranslations } from 'next-intl';

import { StatusChip } from '@/components/ui/status-chip';

import type { AdminClaim } from '../claim-api';
import { claimOutcome } from '../claim-labels';

/** 대기·기한 지남은 경고(처리할 일), 처리한 신고는 결과 이름과 함께 완료로 보여 준다. */
export function ClaimOutcomeChip({
  claim,
}: {
  claim: Pick<AdminClaim, 'status' | 'action'>;
}) {
  const t = useTranslations('admin.claims.outcome');
  const outcome = claimOutcome(claim);
  const isOpen = outcome === 'pending' || outcome === 'overdue';
  return (
    <StatusChip
      status={isOpen ? 'warning' : 'positive'}
      className={
        outcome === 'overdue' ? 'bg-danger-tint text-danger' : undefined
      }
    >
      {t(outcome)}
    </StatusChip>
  );
}
