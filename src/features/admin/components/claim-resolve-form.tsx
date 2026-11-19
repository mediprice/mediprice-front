'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RadioList } from '@/components/ui/radio-list';
import { errorMessageKey } from '@/lib/api/error-message';

import {
  type AdminClaim,
  CLAIM_ACTIONS,
  CLAIM_NOTE_MAX,
  type ClaimAction,
} from '../claim-api';
import { adminClaimMutations } from '../claim-queries';
import {
  claimResolveErrorKey,
  type ClaimResolveForm as ResolveValues,
  type ClaimResolveInput,
  claimResolveSchema,
} from '../schemas';

/** 처리 방법·사유·알림 기록을 받고, 확인을 한 번 더 받은 뒤 보낸다. 제출 버튼은 다이얼로그 바닥에 있어 formId로 잇는다. */
export function ClaimResolveForm({
  claim,
  formId,
  onResolved,
}: {
  claim: AdminClaim;
  formId: string;
  onResolved: (claim: AdminClaim, action: ClaimAction) => void;
}) {
  const t = useTranslations('admin.claims.resolve');
  const tErrors = useTranslations('errors');
  const queryClient = useQueryClient();
  const mutation = useMutation(adminClaimMutations.resolve(queryClient));
  const [pending, setPending] = useState<ResolveValues | null>(null);
  const isResolvedRef = useRef(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimResolveInput, unknown, ResolveValues>({
    resolver: zodResolver(claimResolveSchema),
    defaultValues: { note: '', claimantNotified: false, authorNotified: false },
  });
  const note = useWatch({ control, name: 'note' });
  const message = (key: string | undefined) =>
    key ? t(`errors.${claimResolveErrorKey(key)}`) : undefined;

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit((values) => setPending(values))}
      className="flex flex-col gap-5"
    >
      <RadioList
        legend={t('action')}
        options={CLAIM_ACTIONS.map((value) => ({
          value,
          label: t(`actions.${value}`),
          description: t(`actionDescriptions.${value}`),
        }))}
        inputProps={register('action')}
        error={message(errors.action?.message)}
        errorId={`${formId}-action-error`}
      />
      <div className="flex flex-col gap-2">
        <label htmlFor={`${formId}-note`} className="text-label-bold">
          {t('note')}
        </label>
        <p
          id={`${formId}-note-hint`}
          className="text-body-sm text-text-secondary"
        >
          {t('noteHint')}
        </p>
        <textarea
          id={`${formId}-note`}
          rows={4}
          maxLength={CLAIM_NOTE_MAX}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={`${formId}-note-hint ${formId}-note-count${errors.note ? ` ${formId}-note-error` : ''}`}
          className="min-h-28 w-full resize-y rounded-xl border border-border-strong bg-bg px-4 py-3 text-field aria-invalid:border-danger"
          {...register('note')}
        />
        <div className="flex items-start justify-between gap-3">
          {errors.note ? (
            <p id={`${formId}-note-error`} className="text-body-sm text-danger">
              {message(errors.note.message)}
            </p>
          ) : (
            <span />
          )}
          <p
            id={`${formId}-note-count`}
            className="shrink-0 text-caption text-text-secondary tabular-nums"
          >
            {t('noteCount', { count: note.trim().length, max: CLAIM_NOTE_MAX })}
          </p>
        </div>
      </div>
      <fieldset
        aria-describedby={`${formId}-notified-hint`}
        className="flex min-w-0 flex-col gap-1"
      >
        <legend className="mb-1 text-label-bold">{t('notified')}</legend>
        <p
          id={`${formId}-notified-hint`}
          className="mb-1 text-body-sm text-text-secondary"
        >
          {t('notifiedHint')}
        </p>
        {(['claimantNotified', 'authorNotified'] as const).map((field) => (
          <label
            key={field}
            className="flex min-h-12 cursor-pointer items-center gap-3 text-body"
          >
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-primary"
              {...register(field)}
            />
            {t(field)}
          </label>
        ))}
      </fieldset>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (open) return;
          mutation.reset();
          setPending(null);
        }}
        title={pending ? t(`confirmTitle.${pending.action}`) : t('title')}
        description={t('confirmDescription')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        confirmVariant={pending?.action === 'RESTORE' ? 'primary' : 'danger'}
        isPending={mutation.isPending}
        error={mutation.isError && tErrors(errorMessageKey(mutation.error))}
        onConfirm={() => {
          if (!pending) return;
          mutation.mutate(
            {
              claimId: claim.id,
              action: pending.action,
              note: pending.note,
              ...(pending.claimantNotified && { claimantNotified: true }),
              ...(pending.authorNotified && { authorNotified: true }),
            },
            {
              onSuccess: (resolved) => {
                isResolvedRef.current = true;
                setPending(null);
                onResolved(resolved, pending.action);
              },
            },
          );
        }}
        onCloseAutoFocus={(event) => {
          /** 처리하면 검토 다이얼로그도 함께 닫히므로 포커스는 그쪽(목록)에 맡긴다. */
          if (isResolvedRef.current) event.preventDefault();
        }}
      />
    </form>
  );
}
