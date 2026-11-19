import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { claimFormErrorKey } from '../schemas';

/** 한 줄 입력 칸. 안내 문구는 항상 보이고, 오류는 그 아래에 붙는다. */
export function ClaimTextField({
  id,
  label,
  hint,
  error,
  ...props
}: Omit<ComponentProps<'input'>, 'id'> & {
  id: string;
  label: string;
  hint?: string;
  /** zod·서버 오류 메시지(키). */
  error?: string;
}) {
  const t = useTranslations('claims.errors');
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-bold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="h-12 w-full min-w-0 rounded-xl border border-border-strong bg-bg px-4 text-field transition-colors duration-200 ease-standard hover:border-text-tertiary aria-invalid:border-danger"
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-body-sm text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-body-sm text-danger">
          {t(claimFormErrorKey(error))}
        </p>
      )}
    </div>
  );
}
