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
      <div role="status" className="flex flex-col gap-3">
        <Skeleton className="h-7 w-40" />
        <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {[0, 1].map((index) => (
            <div key={index} className="flex flex-col gap-2.5 py-5">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
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
            variant="tint"
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
          action={
            <Button asChild variant="tint" size="md">
              <Link href="/">{t('browse')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="my-reviews-count" className="flex flex-col gap-3">
      {banner}
      <h2 id="my-reviews-count" className="text-heading">
        {t('count', { count: total })}
      </h2>
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {items.map((review) => (
          <li key={review.id}>
            <MyReviewCard review={review} onDeleted={handleDeleted} />
          </li>
        ))}
      </ul>
      {reviews.hasNextPage && (
        <Button
          variant="outline"
          size="lg"
          className="mt-3 w-full"
          isLoading={reviews.isFetchingNextPage}
          onClick={() => void reviews.fetchNextPage()}
        >
          {t('more')}
        </Button>
      )}
    </section>
  );
}
