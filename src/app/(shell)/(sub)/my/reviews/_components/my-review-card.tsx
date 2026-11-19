'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

import { StatusChip } from '@/components/ui/status-chip';
import { TemporaryMeasureNote } from '@/features/claims/components/temporary-measure-note';
import { readReviewModeration } from '@/features/claims/review-moderation';
import { RatingStars } from '@/features/reviews/components/rating-stars';
import { ReviewMoreMenu } from '@/features/reviews/components/review-more-menu';
import type { Review } from '@/features/reviews/queries';

export function MyReviewCard({
  review,
  onDeleted,
}: {
  review: Review;
  onDeleted: () => void;
}) {
  const t = useTranslations('reviews.my');
  const tMeasure = useTranslations('claims.measure');
  const tReview = useTranslations('hospitals.detail.reviews');
  const format = useFormatter();
  const { status, temporaryMeasure } = readReviewModeration(review);
  const isPublic = status === 'ACTIVE' && !temporaryMeasure;
  const hospitalName = review.hospitalName ?? t('unknownHospital');
  const statusLabel = {
    ACTIVE: t('public'),
    HIDDEN: t('hidden'),
    TEMPORARILY_HIDDEN: tMeasure('chip'),
    DELETED: tMeasure('deletedChip'),
  }[temporaryMeasure ? 'TEMPORARILY_HIDDEN' : status];

  return (
    <article className="flex flex-col gap-2.5 py-5">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-subheading">
          <Link
            href={`/hospitals/${encodeURIComponent(review.ykiho)}`}
            aria-label={t('viewHospital', { name: hospitalName })}
            className="-my-2.5 inline-flex min-h-11 max-w-full items-center gap-0.5 rounded-md hover:underline"
          >
            <span className="min-w-0 wrap-anywhere">{hospitalName}</span>
            <ChevronRight
              aria-hidden="true"
              className="size-4.5 shrink-0 text-text-secondary"
              strokeWidth={1.75}
            />
          </Link>
        </h3>
        {isPublic && (
          <ReviewMoreMenu
            review={review}
            subject={hospitalName}
            from="my"
            onDeleted={onDeleted}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <RatingStars
          rating={review.rating}
          label={tReview('rating', { rating: review.rating })}
        />
        <span
          aria-hidden="true"
          className="text-body-sm text-text-secondary tabular-nums"
        >
          {t('meta', {
            rating: review.rating,
            date: format.dateTime(new Date(review.createdAt), 'dateShort'),
          })}
        </span>
        <time dateTime={review.createdAt} className="sr-only">
          {format.dateTime(new Date(review.createdAt), 'date')}
        </time>
        <StatusChip status={isPublic ? 'positive' : 'warning'}>
          {statusLabel}
        </StatusChip>
      </div>
      <p className="text-body whitespace-pre-line text-text-primary">
        {review.content}
      </p>
      {temporaryMeasure ? (
        <TemporaryMeasureNote
          reviewId={review.id}
          measure={temporaryMeasure}
          subject={hospitalName}
        />
      ) : status === 'DELETED' ? (
        <p className="text-body-sm text-text-secondary">
          {tMeasure('deletedNote')}
        </p>
      ) : (
        status !== 'ACTIVE' && (
          <p className="text-body-sm text-text-secondary">{t('hiddenNote')}</p>
        )
      )}
    </article>
  );
}
