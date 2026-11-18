import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { medicalProfileErrorKey } from '@/features/medical-profile/schemas';
import { cn } from '@/lib/utils';

/** 건강 정보는 민감 정보라 저장 목적을 보여 주고 동의를 받는다. 저장한 프로필이 있으면 이미 동의한 상태로 시작한다. */
export function ConsentField({
  id,
  error,
  ...props
}: Omit<ComponentProps<'input'>, 'id' | 'type'> & {
  id: string;
  error?: string;
}) {
  const t = useTranslations('library.medicalProfile');
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl bg-surface p-5 lg:p-6',
        error && 'outline-2 outline-danger',
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-subheading">{t('consentTitle')}</p>
        <p id={`${id}-purpose`} className="text-body text-text-secondary">
          {t('consentPurpose')}
        </p>
      </div>
      <label
        htmlFor={id}
        className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-bg px-4 py-3 text-body has-checked:border-primary has-checked:bg-primary-tint"
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-purpose${error ? ` ${id}-error` : ''}`}
          className="size-6 shrink-0 accent-primary"
          {...props}
        />
        {t('consentLabel')}
      </label>
      {error && (
        <p id={`${id}-error`} className="text-body text-danger">
          {t(`errors.${medicalProfileErrorKey(error)}`)}
        </p>
      )}
    </div>
  );
}
