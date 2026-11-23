'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import {
  Controller,
  type DefaultValues,
  useForm,
  useWatch,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { type Review, reviewMutations } from '@/features/reviews/queries';
import {
  clearReviewDraft,
  readReviewDraft,
  reviewDraftKey,
  writeReviewDraft,
} from '@/features/reviews/review-draft';
import {
  buildReviewFormSchema,
  invalidFields,
  REVIEW_CONTENT_MAX,
  REVIEW_FORM_FIELDS,
  type ReviewForm as ReviewFormValues,
  type ReviewFormInput,
  todayInSeoul,
} from '@/features/reviews/schemas';
import { errorMessageKey } from '@/lib/api/error-message';

import { FieldError } from './field-error';
import { StarRatingInput } from './star-rating-input';
import { VisitFields } from './visit-fields';

type Props = {
  ykiho: string;
  /** 있으면 수정, 없으면 새 후기다. */
  review?: Review;
  onDirtyChange: (isDirty: boolean) => void;
  onCancel: () => void;
  onSuccess: (review: Review) => void;
};

export function ReviewForm({
  ykiho,
  review,
  onDirtyChange,
  onCancel,
  onSuccess,
}: Props) {
  const t = useTranslations('reviews.form');
  const tErrors = useTranslations('errors');
  const id = useId();
  const queryClient = useQueryClient();
  const isEdit = review != null;
  const [today] = useState(todayInSeoul);
  const draftKey = reviewDraftKey(ykiho, review?.id);
  /** 이 탭에서 쓰다 만 글. 세션이 끝나 다시 로그인하고 돌아와도 이어 쓸 수 있다. */
  const [restoredDraft, setRestoredDraft] = useState(() =>
    readReviewDraft(draftKey),
  );
  const [initialValues] = useState<DefaultValues<ReviewFormInput>>(() => ({
    rating: review?.rating,
    content: review?.content ?? '',
    visitedOn: review?.visitedOn ?? '',
    paidAmount: review?.paidAmount != null ? String(review.paidAmount) : '',
  }));
  const [schema] = useState(() =>
    buildReviewFormSchema({
      today,
      keep: {
        visitedOn: review?.visitedOn != null,
        paidAmount: review?.paidAmount != null,
      },
    }),
  );
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isDirty },
  } = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    resolver: zodResolver(schema),
    /** 별점 Controller가 본문보다 늦게 등록돼 기본 포커스가 화면 순서와 어긋나므로 직접 고른다. */
    shouldFocusError: false,
    defaultValues: restoredDraft ?? initialValues,
  });

  const draftValues = useWatch({ control });
  useEffect(() => {
    writeReviewDraft(draftKey, {
      rating: draftValues.rating,
      content: draftValues.content ?? '',
      visitedOn: draftValues.visitedOn ?? '',
      paidAmount: draftValues.paidAmount ?? '',
    });
  }, [draftKey, draftValues]);

  function discardDraft() {
    clearReviewDraft(draftKey);
    reset(initialValues);
    setRestoredDraft(null);
  }
  const content = useWatch({ control, name: 'content' });
  /** 옵션의 onError(낡은 목록 다시 받기)를 덮지 않도록 화면 처리는 mutate에 넘긴다. */
  const save = useMutation(
    review
      ? reviewMutations.update(queryClient, review.id)
      : reviewMutations.create(queryClient, ykiho),
  );
  const hasFieldErrors =
    save.isError && invalidFields(save.error, REVIEW_FORM_FIELDS).length > 0;

  useEffect(() => {
    onDirtyChange(isDirty && !save.isSuccess);
  }, [isDirty, save.isSuccess, onDirtyChange]);

  const ratingError = errors.rating?.message;
  const contentError = errors.content?.message;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(
        (form) =>
          save.mutate(form, {
            onSuccess: (saved) => {
              clearReviewDraft(draftKey);
              onSuccess(saved);
            },
            onError: (error) => {
              const fields = invalidFields(error, REVIEW_FORM_FIELDS);
              fields.forEach((field) =>
                setError(field, { message: 'invalid' }),
              );
              if (fields[0]) setFocus(fields[0]);
            },
          }),
        (invalid) => {
          const first = REVIEW_FORM_FIELDS.find((field) => invalid[field]);
          if (first) setFocus(first);
        },
      )}
      className="flex flex-col gap-6"
    >
      {restoredDraft && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary-tint px-4 py-2 text-body-sm text-primary-text">
          <p>{t('draftRestored')}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={discardDraft}
          >
            {t('draftDiscard')}
          </Button>
        </div>
      )}
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend id={`${id}-rating`} className="mb-2 text-label-bold">
          {t('rating')}
        </legend>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <StarRatingInput
              ref={field.ref}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              labelledBy={`${id}-rating`}
              describedBy={ratingError ? `${id}-rating-error` : undefined}
              isInvalid={Boolean(ratingError)}
            />
          )}
        />
        <FieldError id={`${id}-rating-error`} message={ratingError} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-content`} className="text-label-bold">
          {t('content')}
        </label>
        <textarea
          id={`${id}-content`}
          rows={7}
          maxLength={REVIEW_CONTENT_MAX}
          placeholder={t('contentPlaceholder')}
          aria-invalid={contentError ? true : undefined}
          aria-describedby={`${id}-content-hint${contentError ? ` ${id}-content-error` : ''}`}
          className="min-h-44 w-full resize-y rounded-xl border border-border-strong bg-bg px-4 py-3.5 text-field placeholder:text-text-tertiary aria-invalid:border-danger"
          {...register('content')}
        />
        <div
          id={`${id}-content-hint`}
          className="flex flex-wrap items-start justify-between gap-x-4 text-caption text-text-secondary"
        >
          <span>{t('contentRange')}</span>
          <span aria-hidden="true" className="ml-auto tabular-nums">
            {t('contentCount', {
              count: content.length,
              max: REVIEW_CONTENT_MAX,
            })}
          </span>
          <span className="sr-only">
            {t('contentCountLabel', {
              count: content.length,
              max: REVIEW_CONTENT_MAX,
            })}
          </span>
        </div>
        <FieldError id={`${id}-content-error`} message={contentError} />
      </div>

      <VisitFields
        register={register}
        errors={errors}
        today={today}
        isEdit={isEdit}
      />

      <ul className="flex flex-col gap-1 rounded-xl bg-surface px-4 py-4 text-body-sm text-text-secondary lg:px-5">
        <li>{t('noticeName')}</li>
        <li>{t('noticePrivacy')}</li>
        <li>{t('noticePublic')}</li>
      </ul>

      {save.isError && !hasFieldErrors && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-danger-tint px-4 py-4 text-danger"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
            strokeWidth={1.75}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-label-bold">
              {isEdit ? t('failedTitleEdit') : t('failedTitle')}
            </p>
            <p className="text-body-sm">
              {tErrors(errorMessageKey(save.error))}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:justify-end">
        <Button
          variant="neutral"
          size="md"
          onClick={onCancel}
          className="max-lg:hidden"
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          size="lg"
          elevated
          isLoading={save.isPending}
          className="w-full lg:min-h-11 lg:w-auto"
        >
          {isEdit ? t('submitEdit') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
