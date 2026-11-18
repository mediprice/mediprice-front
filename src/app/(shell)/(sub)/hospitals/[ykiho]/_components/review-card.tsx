import { Star } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Tag } from '@/components/ui/tag';
import type { components } from '@/lib/api/schema';
import { cn } from '@/lib/utils';

type Review = components['schemas']['ReviewResponse'];

const MAX_RATING = 5;

export function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations('hospitals.detail.reviews');
  const format = useFormatter();
  const rating = Math.min(Math.max(Math.round(review.rating), 0), MAX_RATING);
  const isHidden = review.status === 'HIDDEN';
  const meta = [
    review.visitedOn &&
      t('visited', {
        date: format.dateTime(new Date(review.visitedOn), 'dateShort'),
      }),
    review.paidAmount != null && t('paid', { amount: review.paidAmount }),
  ].filter(Boolean);

  return (
    <article className="flex flex-col gap-2 rounded-xl bg-surface px-5 py-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <p className="text-label-bold text-text-primary">
          {review.authorName ?? t('anonymous')}
        </p>
        {review.mine && <Tag>{t('mine')}</Tag>}
        <span className="flex items-center gap-0.5">
          <span className="sr-only">{t('rating', { rating })}</span>
          {Array.from({ length: MAX_RATING }, (_, index) => (
            <Star
              key={index}
              aria-hidden="true"
              strokeWidth={1.5}
              className={cn(
                'size-3.5',
                index < rating
                  ? 'fill-current text-text-primary'
                  : 'text-border-strong',
              )}
            />
          ))}
        </span>
        <time
          dateTime={review.createdAt}
          className="text-caption text-text-secondary"
        >
          {format.dateTime(new Date(review.createdAt), 'dateShort')}
        </time>
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
