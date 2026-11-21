import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { CLAIM_DESCRIPTION_MAX, claimFormErrorKey } from '../schemas';

/** 침해 내용 칸. 글자 수는 접수할 때처럼 앞뒤 공백을 빼고 센다. */
export function ClaimDescriptionField({
  id,
  text,
  error,
  ...props
}: Omit<ComponentProps<'textarea'>, 'id'> & {
  id: string;
  /** 지금 입력된 글(글자 수 표시용). 입력은 register로 받는다. */
  text: string;
  error?: string;
}) {
  const t = useTranslations('claims.form');
  const tErrors = useTranslations('claims.errors');
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-bold">
        {t('description')}
      </label>
      <p id={`${id}-hint`} className="text-body-sm text-text-secondary">
        {t('descriptionHint')}
      </p>
      <textarea
        id={id}
        rows={6}
        maxLength={CLAIM_DESCRIPTION_MAX}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint ${id}-count${error ? ` ${id}-error` : ''}`}
        className="min-h-40 w-full resize-y rounded-xl border border-border-strong bg-bg px-4 py-3 text-field transition-colors duration-200 ease-standard hover:border-text-tertiary aria-invalid:border-danger"
        {...props}
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
          className="shrink-0 text-body-sm text-text-secondary tabular-nums"
        >
          {t('count', {
            count: text.trim().length,
            max: CLAIM_DESCRIPTION_MAX,
          })}
        </p>
      </div>
    </div>
  );
}
