'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { cn } from '@/lib/utils';

import type { ReviewFormInput } from '../schemas';
import { FieldError } from './field-error';

const INPUT =
  'h-12 w-full rounded-xl border border-border-strong bg-bg px-4 text-field transition-colors duration-200 ease-standard hover:border-text-tertiary focus:border-primary aria-invalid:border-danger';

/** 선택 입력인 방문일과 결제 금액. 수정(PATCH)은 빈 값을 무시해서, 한 번 넣은 값은 바꿀 수만 있고 지울 수 없다고 미리 알린다. */
export function VisitFields({
  register,
  errors,
  today,
  isEdit,
}: {
  register: UseFormRegister<ReviewFormInput>;
  errors: FieldErrors<ReviewFormInput>;
  today: string;
  isEdit: boolean;
}) {
  const t = useTranslations('reviews.form');
  const id = useId();
  const visitedError = errors.visitedOn?.message;
  const paidError = errors.paidAmount?.message;
  const describe = (field: string, error: string | undefined) =>
    `${id}-hint${error ? ` ${id}-${field}-error` : ''}`;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-subheading">{t('visitTitle')}</legend>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor={`${id}-visited`}
            className="text-label text-text-secondary"
          >
            {t('visitedOn')}
          </label>
          <input
            id={`${id}-visited`}
            type="date"
            max={today}
            aria-invalid={visitedError ? true : undefined}
            aria-describedby={describe('visited', visitedError)}
            className={INPUT}
            {...register('visitedOn')}
          />
          <FieldError id={`${id}-visited-error`} message={visitedError} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor={`${id}-paid`}
            className="text-label text-text-secondary"
          >
            {t('paidAmount')}
          </label>
          <input
            id={`${id}-paid`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={11}
            placeholder={t('paidAmountPlaceholder')}
            aria-invalid={paidError ? true : undefined}
            aria-describedby={describe('paid', paidError)}
            className={cn(INPUT, 'tabular-nums placeholder:text-text-tertiary')}
            {...register('paidAmount')}
          />
          <FieldError id={`${id}-paid-error`} message={paidError} />
        </div>
      </div>
      <p id={`${id}-hint`} className="text-body-sm text-text-secondary">
        {isEdit ? t('visitHintEdit') : t('visitHint')}
      </p>
    </fieldset>
  );
}
