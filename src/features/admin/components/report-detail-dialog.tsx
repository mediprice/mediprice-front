'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { RatingStars } from '@/features/reviews/components/rating-stars';

import type { AdminReport, ReportAction } from '../queries';
import { reportReasonKey, reviewStatusKey } from '../report-labels';
import { ReportOutcomeChip } from './report-outcome-chip';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-body-sm text-text-secondary">{label}</dt>
      <dd className="min-w-0 text-body-sm wrap-anywhere">{children}</dd>
    </div>
  );
}

/** 신고 한 건의 전체 내용. 대기 중이면 아래에 처리 버튼을 두고, 누르면 확인을 한 번 더 받는다(onChoose). */
export function ReportDetailDialog({
  report,
  open,
  onOpenChange,
  onChoose,
  onCloseAutoFocus,
}: {
  report: AdminReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (action: ReportAction) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations('admin.reports');
  const format = useFormatter();
  if (!report) return null;
  const { review } = report;
  const dateTime = (value: string) =>
    format.dateTime(new Date(value), 'dateTime');
  const isPending = report.status === 'PENDING';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={t('detail.title', { id: report.id })}
        onCloseAutoFocus={onCloseAutoFocus}
        footer={
          isPending && (
            <div
              role="group"
              aria-label={t('detail.actions')}
              className="flex w-full flex-wrap gap-2 *:flex-[1_1_8rem]"
            >
              <Button
                variant="outline"
                size="md"
                onClick={() => onChoose('DISMISS')}
              >
                {t('resolve.dismiss')}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => onChoose('HIDE_REVIEW')}
              >
                {t('resolve.hide')}
              </Button>
            </div>
          )
        }
      >
        <div className="flex flex-col gap-6">
          <section aria-labelledby="report-detail-report">
            <h3 id="report-detail-report" className="mb-2 text-subheading">
              {t('detail.report')}
            </h3>
            <dl className="flex flex-col gap-2">
              <Field label={t('detail.reason')}>
                {t(`reason.${reportReasonKey(report.reason)}`)}
              </Field>
              <Field label={t('detail.detail')}>
                <span className="whitespace-pre-line">
                  {report.detail || t('noDetail')}
                </span>
              </Field>
              <Field label={t('detail.reportedAt')}>
                {dateTime(report.createdAt)}
              </Field>
              <Field label={t('detail.reporter')}>
                {t('detail.memberId', { id: report.reporterId })}
              </Field>
              <Field label={t('detail.status')}>
                <ReportOutcomeChip report={report} />
              </Field>
              {report.resolvedAt && (
                <Field label={t('detail.resolvedAt')}>
                  {dateTime(report.resolvedAt)}
                </Field>
              )}
              {report.resolvedBy !== null && (
                <Field label={t('detail.resolvedBy')}>
                  {t('detail.memberId', { id: report.resolvedBy })}
                </Field>
              )}
            </dl>
          </section>

          <section aria-labelledby="report-detail-review">
            <h3 id="report-detail-review" className="mb-2 text-subheading">
              {t('detail.review')}
            </h3>
            {review ? (
              <div className="flex flex-col gap-3">
                <dl className="flex flex-col gap-2">
                  <Field label={t('detail.reviewId')}>
                    {t('detail.reviewNumber', { id: review.id })}
                  </Field>
                  <Field label={t('detail.author')}>
                    {review.authorId === null
                      ? t('detail.authorWithdrawn')
                      : t('detail.memberId', { id: review.authorId })}
                  </Field>
                  <Field label={t('detail.writtenAt')}>
                    {dateTime(review.createdAt)}
                  </Field>
                  <Field label={t('detail.reviewStatus')}>
                    {t(`reviewStatus.${reviewStatusKey(review.status)}`)}
                  </Field>
                </dl>
                <div className="flex flex-col gap-2 rounded-xl bg-surface p-3">
                  <RatingStars
                    rating={review.rating}
                    label={t('rating', { rating: review.rating })}
                  />
                  <p className="text-body wrap-anywhere whitespace-pre-line">
                    {review.content}
                  </p>
                </div>
                <Link
                  href={`/hospitals/${encodeURIComponent(review.ykiho)}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 w-fit items-center gap-1 rounded-md text-label text-primary-text hover:underline"
                >
                  {t('detail.hospital')}
                  <ExternalLink
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.75}
                  />
                  <span className="sr-only">{t('detail.hospitalHint')}</span>
                </Link>
              </div>
            ) : (
              <p className="text-body-sm text-text-secondary">
                {t('reviewDeleted')}
              </p>
            )}
          </section>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
