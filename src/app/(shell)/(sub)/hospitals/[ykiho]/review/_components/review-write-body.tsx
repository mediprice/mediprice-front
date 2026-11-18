'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleAlert, EyeOff, MessageSquareText } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewForm } from '@/features/reviews/components/review-form';
import { type Review, reviewQueries } from '@/features/reviews/queries';
import { errorMessageKey } from '@/lib/api/error-message';

import { TargetHospitalCard } from './target-hospital-card';

type Props<T extends string> = {
  ykiho: string;
  editId: number | null;
  backHref: Route<T>;
  onDirtyChange: (isDirty: boolean) => void;
  onCancel: () => void;
  onSaved: () => void;
};

export function ReviewWriteBody<T extends string>({
  editId,
  ...props
}: Props<T>) {
  return editId ? (
    <EditBody editId={editId} {...props} />
  ) : (
    <FormLayout {...props} />
  );
}

/** 후기 한 건을 읽는 API가 없어 내 후기 목록에서 찾는다. 다른 병원의 후기 번호면 찾지 못한 것으로 본다. */
function EditBody<T extends string>({
  editId,
  ...props
}: Omit<Props<T>, 'editId'> & { editId: number }) {
  const t = useTranslations('reviews.write');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const query = useQuery(reviewQueries.myReview(editId));
  const backLabel =
    props.backHref === '/my/reviews'
      ? t('backToMyReviews')
      : t('backToHospital');

  if (query.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <span className="sr-only">{t('title')}</span>
      </div>
    );
  }
  if (query.isError) {
    return (
      <EmptyState
        icon={<CircleAlert />}
        title={t('loadError')}
        description={tErrors(errorMessageKey(query.error))}
        action={
          <Button
            variant="outline"
            size="md"
            isLoading={query.isRefetching}
            onClick={() => void query.refetch()}
          >
            {tActions('retry')}
          </Button>
        }
      />
    );
  }
  const review = query.data;
  if (!review || review.ykiho !== props.ykiho || review.status === 'HIDDEN') {
    const isHidden = review?.status === 'HIDDEN';
    return (
      <EmptyState
        icon={isHidden ? <EyeOff /> : <MessageSquareText />}
        title={isHidden ? t('hiddenTitle') : t('notFoundTitle')}
        description={
          isHidden ? t('hiddenDescription') : t('notFoundDescription')
        }
        action={
          <Button asChild variant="tint" size="md">
            <Link href={props.backHref}>{backLabel}</Link>
          </Button>
        }
      />
    );
  }
  return <FormLayout review={review} {...props} />;
}

function FormLayout<T extends string>({
  ykiho,
  review,
  onDirtyChange,
  onCancel,
  onSaved,
}: Omit<Props<T>, 'editId'> & { review?: Review }) {
  return (
    <div className="flex flex-col gap-6">
      <TargetHospitalCard ykiho={ykiho} fallbackName={review?.hospitalName} />
      <ReviewForm
        ykiho={ykiho}
        review={review}
        onDirtyChange={onDirtyChange}
        onCancel={onCancel}
        onSuccess={onSaved}
      />
    </div>
  );
}
