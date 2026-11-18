'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { errorMessageKey } from '@/lib/api/error-message';

import { type Review, reviewMutations } from '../queries';
import {
  invalidFields,
  REVIEW_CONTENT_MAX,
  REVIEW_FORM_FIELDS,
  type ReviewForm as ReviewFormValues,
  reviewFormErrorKey,
  type ReviewFormInput,
  reviewFormSchema,
} from '../schemas';
import { StarRatingInput } from './star-rating-input';

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
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<ReviewFormInput, unknown, ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: review
      ? { rating: review.rating, content: review.content }
      : { rating: undefined, content: '' },
  });
  const content = useWatch({ control, name: 'content' });
  const save = useMutation({
    ...(review
      ? reviewMutations.update(queryClient, review.id)
      : reviewMutations.create(queryClient, ykiho)),
    onError: (error) => {
      const fields = invalidFields(error, REVIEW_FORM_FIELDS);
      fields.forEach((field) => setError(field, { message: 'invalid' }));
      if (fields[0]) setFocus(fields[0]);
    },
  });
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
      onSubmit={handleSubmit((form) =>
        save.mutate(form, { onSuccess: (saved) => onSuccess(saved) }),
      )}
      className="flex flex-col gap-6"
    >
      <fieldset className="flex flex-col gap-2">
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
        {ratingError && (
          <p id={`${id}-rating-error`} className="text-body-sm text-danger">
            {t(`errors.${reviewFormErrorKey(ratingError)}`)}
          </p>
        )}
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
          className="flex items-start justify-between gap-4 text-caption text-text-secondary"
        >
          <span>{t('contentRange')}</span>
          <span aria-hidden="true" className="shrink-0 tabular-nums">
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
        {contentError && (
          <p id={`${id}-content-error`} className="text-body-sm text-danger">
            {t(`errors.${reviewFormErrorKey(contentError)}`)}
          </p>
        )}
      </div>

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
