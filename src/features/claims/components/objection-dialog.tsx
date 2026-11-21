'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

import { claimMutations } from '../queries';
import {
  claimFormErrorKey,
  OBJECTION_CONTENT_MAX,
  type ObjectionForm,
  objectionFormSchema,
} from '../schemas';

type Outcome = 'done' | 'already' | 'closed';

/** 이미 요청했거나(409) 처리가 끝났으면(404 ACTIVE_CLAIM_NOT_FOUND) 실패가 아니라 결과로 보여 준다. */
function outcomeOf(error: unknown): Outcome | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === 'CLAIM_OBJECTION_ALREADY_SUBMITTED') return 'already';
  if (error.code === 'ACTIVE_CLAIM_NOT_FOUND') return 'closed';
  return null;
}

export function ObjectionDialog({
  reviewId,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  reviewId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = useTranslations('claims.objection');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  /** 닫히는 애니메이션 동안 결과 화면을 유지하고, 다시 열 때 양식부터 시작한다. */
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOutcome(null);
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        title={outcome ? t(`${outcome}Title`) : t('title')}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {outcome ? (
          <div role="status" className="flex flex-col gap-5">
            <p className="flex items-start gap-2 text-body text-text-secondary">
              {outcome === 'done' ? (
                <CircleCheck
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-positive"
                  strokeWidth={1.75}
                />
              ) : (
                <Info
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary-text"
                  strokeWidth={1.75}
                />
              )}
              {t(`${outcome}Description`)}
            </p>
            <ConfirmButton onClick={() => onOpenChange(false)} />
          </div>
        ) : (
          open && <ObjectionForm reviewId={reviewId} onOutcome={setOutcome} />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function ObjectionForm({
  reviewId,
  onOutcome,
}: {
  reviewId: number;
  onOutcome: (outcome: Outcome) => void;
}) {
  const t = useTranslations('claims.objection');
  const tErrors = useTranslations('claims.errors');
  const tApiErrors = useTranslations('errors');
  const id = useId();
  const queryClient = useQueryClient();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ObjectionForm>({
    resolver: zodResolver(objectionFormSchema),
    defaultValues: { content: '' },
  });
  const content = useWatch({ control, name: 'content' });
  const object = useMutation(claimMutations.object(queryClient, reviewId));
  const error = errors.content?.message;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((form) =>
        object.mutate(form, {
          onSuccess: () => onOutcome('done'),
          onError: (error) => {
            const outcome = outcomeOf(error);
            if (outcome) onOutcome(outcome);
          },
        }),
      )}
      className="flex flex-col gap-4"
    >
      <p className="text-body text-text-secondary">{t('description')}</p>
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-content`} className="text-label-bold">
          {t('content')}
        </label>
        <textarea
          id={`${id}-content`}
          rows={5}
          maxLength={OBJECTION_CONTENT_MAX}
          placeholder={t('placeholder')}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`}
          className="min-h-32 w-full resize-y rounded-xl border border-border-strong bg-bg px-4 py-3 text-field placeholder:text-text-tertiary aria-invalid:border-danger"
          {...register('content')}
        />
        <div className="flex items-start justify-between gap-3">
          {error ? (
            <p id={`${id}-error`} className="text-body-sm text-danger">
              {tErrors(claimFormErrorKey(error))}
            </p>
          ) : (
            <span />
          )}
          <p
            id={`${id}-count`}
            className="shrink-0 text-caption text-text-secondary tabular-nums"
          >
            {t('count', {
              count: content.trim().length,
              max: OBJECTION_CONTENT_MAX,
            })}
          </p>
        </div>
      </div>
      {object.isError && !outcomeOf(object.error) && (
        <p
          role="alert"
          className="rounded-lg bg-danger-tint px-4 py-3 text-body-sm text-danger"
        >
          {tApiErrors(errorMessageKey(object.error))}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        isLoading={object.isPending}
        className="w-full"
      >
        {t('submit')}
      </Button>
    </form>
  );
}

function ConfirmButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations('common.actions');
  return (
    <Button size="lg" onClick={onClick} className="w-full">
      {t('confirm')}
    </Button>
  );
}
