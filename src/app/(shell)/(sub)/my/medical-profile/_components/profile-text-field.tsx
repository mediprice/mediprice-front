import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import {
  medicalProfileErrorKey,
  TEXT_MAX_LENGTH,
} from '@/features/medical-profile/schemas';
import { cn } from '@/lib/utils';

/** 글 칸 하나. 글자 수는 저장할 때처럼 앞뒤 공백을 빼고 센다. */
export function ProfileTextField({
  id,
  label,
  text,
  error,
  className,
  ...props
}: Omit<ComponentProps<'textarea'>, 'id' | 'value'> & {
  id: string;
  label: string;
  /** 지금 입력된 글(글자 수 표시용). 입력은 register로 받는다. */
  text: string;
  /** zod·서버 오류 메시지(키). */
  error?: string;
}) {
  const t = useTranslations('library.medicalProfile');
  const count = text.trim().length;
  const isOver = count > TEXT_MAX_LENGTH;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-subheading">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`}
        className="min-h-28 w-full resize-y rounded-xl border border-border-strong bg-bg px-4 py-3 text-field transition-colors duration-200 ease-standard placeholder:text-text-tertiary hover:border-text-tertiary aria-invalid:border-danger"
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} className="text-body-sm text-danger">
            {t(`errors.${medicalProfileErrorKey(error)}`)}
          </p>
        ) : (
          <span />
        )}
        <p
          id={`${id}-count`}
          className={cn(
            'shrink-0 text-body-sm tabular-nums',
            isOver ? 'text-danger' : 'text-text-secondary',
          )}
        >
          {t('charCount', { count, max: TEXT_MAX_LENGTH })}
        </p>
      </div>
    </div>
  );
}
