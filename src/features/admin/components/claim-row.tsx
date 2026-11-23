'use client';

import { MessageSquareReply } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import type { AdminClaim } from '@/features/admin/claim-api';
import { claimReasonKey, isClaimActive } from '@/features/admin/claim-labels';
import { reviewStatusKey } from '@/features/admin/report-labels';
import { RatingStars } from '@/features/reviews/components/rating-stars';
import { cn } from '@/lib/utils';

import { ClaimOutcomeChip } from './claim-outcome-chip';

/** 목록에는 판단에 필요한 것(사유·기한·후기 앞부분)만 둔다. 신청인 이름·이메일(개인정보)은 검토 다이얼로그에서만 보인다. */
export function ClaimRow({
  claim,
  onOpen,
}: {
  claim: AdminClaim;
  onOpen: (claim: AdminClaim) => void;
}) {
  const t = useTranslations('admin.claims');
  const format = useFormatter();
  const { review } = claim;
  const isActive = isClaimActive(claim);
  const isOverdue = claim.status === 'EXPIRED_PENDING';
  const deadline = format.dateTime(new Date(claim.temporaryUntil), 'dateTime');

  return (
    <article className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Tag>{t(`reason.${claimReasonKey(claim.reason)}`)}</Tag>
          <ClaimOutcomeChip claim={claim} />
          <span className="text-caption text-text-secondary tabular-nums">
            {t('number', { id: claim.id })}
          </span>
          <time
            dateTime={claim.createdAt}
            className="text-caption text-text-secondary tabular-nums"
          >
            {t('receivedAt', {
              date: format.dateTime(new Date(claim.createdAt), 'dateTime'),
            })}
          </time>
        </div>
        {isActive && (
          <p
            className={cn(
              'text-label tabular-nums',
              isOverdue ? 'text-label-bold text-danger' : 'text-text-secondary',
            )}
          >
            {isOverdue
              ? t('deadlinePassed', { date: deadline })
              : t('deadline', { date: deadline })}
          </p>
        )}
        <p className="line-clamp-3 text-body wrap-anywhere whitespace-pre-line">
          {claim.description}
        </p>
        {claim.objection !== null && (
          <p className="flex items-center gap-1.5 text-label text-primary-text">
            <MessageSquareReply
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={1.75}
            />
            {t('hasObjection')}
          </p>
        )}
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
        variant={isActive ? 'tint' : 'outline'}
        size="sm"
        aria-label={t('openFor', { id: claim.id })}
        className="self-start"
        onClick={() => onOpen(claim)}
      >
        {t('open')}
      </Button>
    </article>
  );
}
