'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { CircleAlert, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewNoticeBanner } from '@/features/reviews/components/review-notice-banner';
import { reviewQueries } from '@/features/reviews/queries';
import { useReviewNotice } from '@/features/reviews/review-notice';
import { errorMessageKey } from '@/lib/api/error-message';

import { MyReviewCard } from './my-review-card';

export function MyReviewList() {
  const t = useTranslations('reviews.my');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const reviews = useInfiniteQuery(reviewQueries.mine());
  const [notice, setNotice] = useReviewNotice('my');
  const [noticeCount, setNoticeCount] = useState(0);
  const items = reviews.data?.pages.flatMap((page) => page.content) ?? [];
  const total = reviews.data?.pages[0]?.totalElements ?? 0;

  function handleDeleted() {
    setNotice('deleted');
    setNoticeCount((count) => count + 1);
  }

  const banner = notice && (
    <ReviewNoticeBanner key={noticeCount} kind={notice} />
  );

  if (reviews.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <span className="sr-only">{t('title')}</span>
      </div>
    );
  }

  if (reviews.isError && items.length === 0) {
    return (
      <EmptyState
        icon={<CircleAlert />}
        title={t('loadError')}
        description={tErrors(errorMessageKey(reviews.error))}
        action={
          <Button
            variant="outline"
            size="md"
            isLoading={reviews.isRefetching}
            onClick={() => void reviews.refetch()}
          >
            {tActions('retry')}
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {banner}
        <EmptyState
          icon={<MessageSquareText />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="py-16"
          action={
            <Button asChild size="md">
              <Link href="/">{t('browse')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="my-reviews-count" className="flex flex-col gap-4">
      {banner}
      <div className="flex flex-col gap-1">
        <h2 id="my-reviews-count" className="text-heading">
          {t('count', { count: total })}
        </h2>
        <p className="text-body-sm text-text-secondary lg:hidden">
          {t('description')}
        </p>
      </div>
      <ul className="flex flex-col gap-3 lg:gap-4">
        {items.map((review) => (
          <li key={review.id}>
            <MyReviewCard review={review} onDeleted={handleDeleted} />
          </li>
        ))}
      </ul>
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
