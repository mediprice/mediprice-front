'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Lock, MessageSquareText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { reviewQueries } from '@/features/reviews/queries';

import { ReviewCard } from './review-card';
import { SectionError } from './section-error';
import { useStickyError } from './use-sticky-error';

/** 읽기 전용 후기 목록. 작성·신고는 로그인이 필요해 안내만 한다. */
export function ReviewSection({ ykiho }: { ykiho: string }) {
  const t = useTranslations('hospitals.detail.reviews');
  const reviews = useInfiniteQuery(reviewQueries.hospital(ykiho));
  const failure = useStickyError(reviews.error, () => reviews.refetch());
  const items = reviews.data?.pages.flatMap((page) => page.content) ?? [];
  const total = reviews.data?.pages[0]?.totalElements;

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="flex scroll-mt-14 flex-col gap-4"
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 id="reviews-title" className="text-heading">
          {t('title')}
        </h2>
        {total != null && total > 0 && (
          <span className="text-body-sm text-text-secondary tabular-nums">
            {t('count', { count: total })}
          </span>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-caption text-text-secondary">
        <Lock aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
        {t('loginNote')}
      </p>

      {failure.error ? (
        <SectionError
          error={failure.error}
          isRetrying={failure.isRetrying}
          onRetry={() => void failure.retry()}
        />
      ) : reviews.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="rounded-xl bg-surface py-10"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      )}

      {reviews.hasNextPage && (
        <Button
          variant="outline"
          size="md"
          className="w-full"
          isLoading={reviews.isFetchingNextPage}
          onClick={() => void reviews.fetchNextPage()}
        >
          {t('more')}
        </Button>
      )}
    </section>
  );
}
