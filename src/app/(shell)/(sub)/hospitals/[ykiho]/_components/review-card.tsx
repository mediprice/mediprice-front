import { useFormatter, useTranslations } from 'next-intl';

import { Tag } from '@/components/ui/tag';
import {
  clampRating,
  RatingStars,
} from '@/features/reviews/components/rating-stars';
import { ReviewMoreMenu } from '@/features/reviews/components/review-more-menu';
import type { Review } from '@/features/reviews/queries';
import { cn } from '@/lib/utils';

export function ReviewCard({
  review,
  onDeleted,
}: {
  review: Review;
  onDeleted?: () => void;
}) {
  const t = useTranslations('hospitals.detail.reviews');
  const format = useFormatter();
  const rating = clampRating(review.rating);
  const isHidden = review.status === 'HIDDEN';
  const author = review.authorName ?? t('anonymous');
  const meta = [
    review.visitedOn &&
      t('visited', {
        date: format.dateTime(new Date(review.visitedOn), 'dateShort'),
      }),
    review.paidAmount != null && t('paid', { amount: review.paidAmount }),
  ].filter(Boolean);

  return (
    <article className="flex flex-col gap-2 rounded-xl bg-surface px-5 py-4 lg:px-6">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="text-label-bold text-text-primary">{author}</p>
          {review.mine && <Tag>{t('mine')}</Tag>}
          <RatingStars rating={rating} label={t('rating', { rating })} />
          <time
            dateTime={review.createdAt}
            className="text-caption text-text-secondary"
          >
            {format.dateTime(new Date(review.createdAt), 'dateShort')}
          </time>
        </div>
        {!isHidden && (
          <ReviewMoreMenu
            review={review}
            subject={author}
            from="hospital"
            onDeleted={onDeleted}
          />
        )}
      </div>
      <p
        className={cn(
          'text-body-sm whitespace-pre-line',
          isHidden ? 'text-text-tertiary' : 'text-text-primary',
        )}
      >
        {isHidden ? t('hidden') : review.content}
      </p>
      {meta.length > 0 && (
        <p className="text-caption text-text-secondary tabular-nums">
          {meta.join(' · ')}
        </p>
      )}
    </article>
  );
}
