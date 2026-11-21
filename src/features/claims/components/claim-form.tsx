'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { RadioList } from '@/components/ui/radio-list';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

import type { ClaimReceipt } from '../api';
import { claimMutations } from '../queries';
import {
  CLAIM_REASONS,
  CLAIMANT_EMAIL_MAX,
  CLAIMANT_NAME_MAX,
  CLAIMANT_ROLES,
  type ClaimForm as ClaimFormValues,
  claimFormErrorKey,
  type ClaimFormInput,
  claimFormSchema,
  claimInvalidFields,
} from '../schemas';
import { ClaimDescriptionField } from './claim-description-field';
import { ClaimPrivacyNotice } from './claim-privacy-notice';
import { ClaimTextField } from './claim-text-field';

const AFTER = ['hidden', 'author', 'decision'] as const;

/** 권리침해 신고 양식. 접수를 받을 수 없으면(isClosed) 내용은 보이되 입력과 제출을 막는다. */
export function ClaimForm({
  reviewId,
  isClosed,
  onSubmitted,
}: {
  reviewId: number;
  isClosed: boolean;
  onSubmitted: (receipt: ClaimReceipt, email: string) => void;
}) {
  const t = useTranslations('claims.form');
  const tErrors = useTranslations('claims.errors');
  const tApiErrors = useTranslations('errors');
  const id = useId();
  const queryClient = useQueryClient();
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ClaimFormInput, unknown, ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      description: '',
      claimantName: '',
      claimantEmail: '',
      agreement: false,
    },
  });
  const description = useWatch({ control, name: 'description' });
  const submit = useMutation(claimMutations.submit(queryClient, reviewId));
  /** 옵션의 onSuccess·onError(캐시 무효화)를 덮지 않도록 화면 처리는 mutate에 넘긴다. */
  function send(form: ClaimFormValues) {
    submit.mutate(form, {
      onSuccess: (receipt) => onSubmitted(receipt, form.claimantEmail),
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.code === 'CLAIM_NOTICE_VERSION_OUTDATED'
        ) {
          setValue('agreement', false);
        }
        claimInvalidFields(error).forEach((field) =>
          setError(field, { message: 'invalid' }),
        );
      },
    });
  }
  const hasFieldErrors =
    submit.isError && claimInvalidFields(submit.error).length > 0;
  const message = (key: string | undefined) =>
    key ? tErrors(claimFormErrorKey(key)) : undefined;
  const isReviewGone =
    submit.error instanceof ApiError &&
    submit.error.code === 'REVIEW_NOT_FOUND';

  return (
    <form noValidate onSubmit={handleSubmit(send)}>
      <fieldset
        disabled={isClosed}
        className="flex min-w-0 flex-col gap-8 disabled:opacity-60"
      >
        <RadioList
          legend={t('reason')}
          options={CLAIM_REASONS.map((value) => ({
            value,
            label: t(`reasons.${value}`),
          }))}
          inputProps={register('reason')}
          error={message(errors.reason?.message)}
          errorId={`${id}-reason-error`}
        />

        <ClaimDescriptionField
          id={`${id}-description`}
          text={description}
          error={errors.description?.message}
          {...register('description')}
        />

        <RadioList
          legend={t('role')}
          options={CLAIMANT_ROLES.map((value) => ({
            value,
            label: t(`roles.${value}`),
            description: t(`roleDescriptions.${value}`),
          }))}
          inputProps={register('claimantRole')}
          error={message(errors.claimantRole?.message)}
          errorId={`${id}-role-error`}
        />

        <fieldset className="flex min-w-0 flex-col gap-5">
          <legend className="mb-3 text-subheading">{t('applicant')}</legend>
          <ClaimTextField
            id={`${id}-name`}
            label={t('name')}
            hint={t('nameHint')}
            type="text"
            autoComplete="name"
            maxLength={CLAIMANT_NAME_MAX}
            error={errors.claimantName?.message}
            {...register('claimantName')}
          />
          <ClaimTextField
            id={`${id}-email`}
            label={t('email')}
            hint={t('emailHint')}
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            maxLength={CLAIMANT_EMAIL_MAX}
            error={errors.claimantEmail?.message}
            {...register('claimantEmail')}
          />
        </fieldset>

        <ClaimPrivacyNotice
          id={`${id}-agreement`}
          error={errors.agreement?.message}
          {...register('agreement')}
        />

        <section
          aria-labelledby={`${id}-after`}
          className="flex flex-col gap-2"
        >
          <h2 id={`${id}-after`} className="text-subheading">
            {t('afterTitle')}
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-body text-text-secondary marker:text-text-tertiary">
            {AFTER.map((key) => (
              <li key={key} className="pl-1">
                {t(`after.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        {submit.isError && !hasFieldErrors && (
          <p
            role="alert"
            className="rounded-lg bg-danger-tint px-4 py-3 text-body-sm text-danger"
          >
            {isReviewGone
              ? t('reviewGone')
              : tApiErrors(errorMessageKey(submit.error))}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          isLoading={submit.isPending}
          className="w-full md:w-auto md:self-start md:px-8"
        >
          {t('submit')}
        </Button>
      </fieldset>
    </form>
  );
}
