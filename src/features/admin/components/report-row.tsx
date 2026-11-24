'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import type { AdminReport } from '@/features/admin/queries';
import {
  reportReasonKey,
  reviewStatusKey,
} from '@/features/admin/report-labels';
import { RatingStars } from '@/features/reviews/components/rating-stars';

import { ReportOutcomeChip } from './report-outcome-chip';

/** 목록에서 판단에 필요한 것(사유·설명·후기 앞부분)만 보이고, 전체 내용과 처리는 검토 다이얼로그에서 한다. */
export function ReportRow({
  report,
  onOpen,
}: {
  report: AdminReport;
  onOpen: (report: AdminReport) => void;
}) {
  const t = useTranslations('admin.reports');
  const format = useFormatter();
  const { review } = report;
  const createdAt = new Date(report.createdAt);

  return (
    <article className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Tag>{t(`reason.${reportReasonKey(report.reason)}`)}</Tag>
          <ReportOutcomeChip report={report} />
          <span className="text-caption text-text-secondary tabular-nums">
            {t('number', { id: report.id })}
          </span>
          <time
            dateTime={report.createdAt}
            className="text-caption text-text-secondary tabular-nums"
          >
            {t('reportedAt', {
              date: format.dateTime(createdAt, 'dateTime'),
            })}
          </time>
        </div>
        <p
          className={
            report.detail
              ? 'text-body wrap-anywhere whitespace-pre-line'
              : 'text-body-sm text-text-tertiary'
          }
        >
          {report.detail || t('noDetail')}
        </p>
        <div className="flex flex-col gap-1.5 rounded-xl bg-surface px-3 py-2.5">
          {review ? (
            <>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-caption-strong text-text-secondary">
                  {t('review')}
                </span>
                <RatingStars
                  rating={review.rating}
                  label={t('rating', { rating: review.rating })}
                />
                <span className="text-caption text-text-secondary">
                  {t(`reviewStatus.${reviewStatusKey(review.status)}`)}
                </span>
              </div>
              <p className="line-clamp-3 text-body-sm wrap-anywhere whitespace-pre-line">
                {review.content}
              </p>
            </>
          ) : (
            <p className="text-body-sm text-text-secondary">
              {t('reviewDeleted')}
            </p>
          )}
        </div>
      </div>
      <Button
        variant={report.status === 'PENDING' ? 'tint' : 'outline'}
        size="sm"
        aria-label={t('openFor', { id: report.id })}
        className="self-start"
        onClick={() => onOpen(report)}
      >
        {t('open')}
      </Button>
    </article>
  );
}
