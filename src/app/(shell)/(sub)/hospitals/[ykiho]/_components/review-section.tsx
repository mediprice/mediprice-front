'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Lock, MessageSquareText, PenLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoginGuard, useSession } from '@/features/auth/use-session';
import { ReviewNoticeBanner } from '@/features/reviews/components/review-notice-banner';
import { reviewQueries } from '@/features/reviews/queries';
import { useReviewNotice } from '@/features/reviews/review-notice';
import { reviewWriteHref } from '@/features/reviews/write-href';

import { ReviewCard } from './review-card';
import { SectionError } from './section-error';
import { useStickyError } from './use-sticky-error';

/** 병원 후기 목록. 작성·수정·삭제·신고는 로그인이 필요해 누를 때 로그인을 먼저 묻는다. */
export function ReviewSection({ ykiho }: { ykiho: string }) {
  const t = useTranslations('hospitals.detail.reviews');
  const tReviews = useTranslations('reviews.section');
  const router = useRouter();
  const { status } = useSession();
  const guard = useLoginGuard();
  const [notice, setNotice] = useReviewNotice(ykiho);
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
      <SectionHeader
        id="reviews-title"
        title={t('title')}
        description={
          total != null && total > 0
            ? tReviews('count', { count: total })
            : undefined
        }
        action={
          <Button
            variant="tint"
            size="md"
            onClick={guard('review', () => router.push(reviewWriteHref(ykiho)))}
          >
            <PenLine aria-hidden="true" />
            {tReviews('write')}
          </Button>
        }
      />
      {status === 'anonymous' && (
        <p className="flex items-start gap-2 text-body-sm text-text-secondary">
          <Lock
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.75}
          />
          {t('loginNote')}
        </p>
      )}
      {notice && !reviews.isPending && <ReviewNoticeBanner kind={notice} />}

      {failure.error ? (
        <SectionError
          error={failure.error}
          isRetrying={failure.isRetrying}
          onRetry={() => void failure.retry()}
        />
      ) : reviews.isPending ? (
        <div
          aria-hidden="true"
          className="flex flex-col divide-y divide-hairline"
        >
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2.5 py-5">
              <Skeleton className="h-5.5 w-48" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText />}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          className="rounded-2xl bg-surface py-10"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {items.map((review) => (
            <li key={review.id}>
              <ReviewCard
                review={review}
                onDeleted={() => setNotice('deleted')}
              />
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
