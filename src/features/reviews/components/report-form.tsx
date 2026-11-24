'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { type Review, reviewMutations } from '@/features/reviews/queries';
import {
  invalidFields,
  REPORT_DETAIL_MAX,
  REPORT_FORM_FIELDS,
  REPORT_REASONS,
  type ReportForm as ReportFormValues,
  type ReportFormInput,
  reportFormSchema,
} from '@/features/reviews/schemas';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

export type ReportOutcome = 'done' | 'already';

function reportErrorKey(message: string | undefined) {
  return message === 'reasonRequired' || message === 'detailTooLong'
    ? message
    : 'failed';
}

export function ReportForm({
  review,
  onCancel,
  onOutcome,
}: {
  review: Review;
  onCancel: () => void;
  onOutcome: (outcome: ReportOutcome) => void;
}) {
  const t = useTranslations('reviews.report');
  const tReview = useTranslations('hospitals.detail.reviews');
  const tErrors = useTranslations('errors');
  const tActions = useTranslations('common.actions');
  const format = useFormatter();
  const id = useId();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReportFormInput, unknown, ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { detail: '' },
  });
  const detail = useWatch({ control, name: 'detail' });
  const reason = useWatch({ control, name: 'reason' });
  const report = useMutation({
    ...reviewMutations.report(review.id),
    onSuccess: () => onOutcome('done'),
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.code === 'REVIEW_ALREADY_REPORTED'
      ) {
        onOutcome('already');
        return;
      }
      invalidFields(error, REPORT_FORM_FIELDS).forEach((field) =>
        setError(field, { message: 'invalid' }),
      );
    },
  });
  const hasFieldErrors =
    report.isError &&
    invalidFields(report.error, REPORT_FORM_FIELDS).length > 0;
  const reasonError = errors.reason?.message;
  const detailError = errors.detail?.message;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((form) => report.mutate(form))}
      className="flex flex-col gap-5"
    >
      <figure className="flex flex-col gap-1 rounded-xl bg-surface px-4 py-3">
        <figcaption className="text-caption text-text-secondary">
          {t('target')}
        </figcaption>
        <p className="flex flex-wrap items-baseline gap-x-2 text-label-bold">
          {review.authorName ?? tReview('anonymous')}
          <time
            dateTime={review.createdAt}
            className="text-caption text-text-secondary"
          >
            {format.dateTime(new Date(review.createdAt), 'dateShort')}
          </time>
        </p>
        <p className="line-clamp-2 text-body-sm text-text-primary">
          {review.content}
        </p>
      </figure>

      <fieldset
        aria-describedby={reasonError ? `${id}-reason-error` : undefined}
        className="flex flex-col"
      >
        <legend className="mb-1 text-label-bold">{t('reason')}</legend>
        <div className="flex flex-col divide-y divide-hairline">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason}
              className="group flex min-h-12 cursor-pointer items-center gap-3 py-1 text-body"
            >
              <input
                type="radio"
                value={reason}
                className="peer sr-only"
                {...register('reason')}
              />
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong transition-colors duration-150 ease-standard group-has-checked:border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring"
              >
                <span className="size-2.5 scale-0 rounded-full bg-primary transition-transform duration-150 ease-standard group-has-checked:scale-100" />
              </span>
              <span className="group-has-checked:text-label-bold">
                {t(`reasons.${reason}`)}
              </span>
            </label>
          ))}
        </div>
        {reasonError && (
          <p
            id={`${id}-reason-error`}
            className="mt-1 text-body-sm text-danger"
          >
            {t(reportErrorKey(reasonError))}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-detail`} className="text-label-bold">
          {t('detail')}
        </label>
        <textarea
          id={`${id}-detail`}
          rows={3}
          maxLength={REPORT_DETAIL_MAX}
          placeholder={t('detailPlaceholder')}
          aria-invalid={detailError ? true : undefined}
          aria-describedby={`${id}-detail-count${detailError ? ` ${id}-detail-error` : ''}`}
          className="min-h-24 w-full resize-y rounded-xl border border-border-strong bg-bg px-4 py-3 text-field placeholder:text-text-tertiary aria-invalid:border-danger"
          {...register('detail')}
        />
        <p
          id={`${id}-detail-count`}
          className="text-right text-caption text-text-secondary tabular-nums"
        >
          {t('detailCount', { count: detail.length, max: REPORT_DETAIL_MAX })}
        </p>
        {detailError && (
          <p id={`${id}-detail-error`} className="text-body-sm text-danger">
            {t(reportErrorKey(detailError))}
          </p>
        )}
      </div>

      {report.isError && !hasFieldErrors && (
        <p
          role="alert"
          className="rounded-lg bg-danger-tint px-4 py-3 text-body-sm text-danger"
        >
          {tErrors(errorMessageKey(report.error))}
        </p>
      )}

      {!reason && (
        <p
          id={`${id}-submit-hint`}
          className="-mb-3 text-body-sm text-text-secondary lg:text-right"
        >
          {t('reasonHint')}
        </p>
      )}
      <div className="flex flex-col gap-2 lg:flex-row lg:justify-end">
        <Button
          variant="neutral"
          size="md"
          onClick={onCancel}
          className="max-lg:hidden"
        >
          {tActions('cancel')}
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={!reason}
          aria-describedby={reason ? undefined : `${id}-submit-hint`}
          isLoading={report.isPending}
          className="w-full lg:min-h-11 lg:w-auto"
        >
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
