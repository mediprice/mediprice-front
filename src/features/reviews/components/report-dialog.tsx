'use client';

import { CircleCheck, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { DialogConfirmButton } from '@/components/ui/dialog-confirm-button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import type { Review } from '@/features/reviews/queries';

import { ReportForm, type ReportOutcome } from './report-form';

/** S-20 후기 신고. 모바일은 바텀시트, 데스크톱은 가운데 모달이다. 이미 신고한 후기(409)는 실패가 아니라 결과로 보여 준다. */
export function ReportDialog({
  review,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  review: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations('reviews.report');
  const [outcome, setOutcome] = useState<ReportOutcome | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  /** 닫히는 애니메이션 동안 결과 화면을 유지하고, 다시 열 때 폼부터 시작한다. */
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOutcome(null);
  }
  const title =
    outcome === 'done'
      ? t('doneTitle')
      : outcome === 'already'
        ? t('alreadyTitle')
        : t('title');

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={title}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {outcome ? (
          <div role="status" className="flex flex-col gap-5">
            <p className="flex items-start gap-2 text-body text-text-secondary">
              {outcome === 'done' ? (
                <CircleCheck
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-positive"
                  strokeWidth={1.75}
                />
              ) : (
                <Info
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary-text"
                  strokeWidth={1.75}
                />
              )}
              {outcome === 'done'
                ? t('doneDescription')
                : t('alreadyDescription')}
            </p>
            <DialogConfirmButton
              onClick={() => onOpenChange(false)}
              className="lg:min-h-11"
            />
          </div>
        ) : (
          <ReportForm
            review={review}
            onCancel={() => onOpenChange(false)}
            onOutcome={setOutcome}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
