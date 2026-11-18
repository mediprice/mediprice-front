import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { medicalProfileErrorKey } from '@/features/medical-profile/schemas';

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
    <div className="flex flex-col gap-2 rounded-xl bg-primary-tint p-4 lg:p-6">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-purpose${error ? ` ${id}-error` : ''}`}
          className="touch-target mt-0.5 size-5 shrink-0 accent-primary"
          {...props}
        />
        <label htmlFor={id} className="text-body">
          {t('consentLabel')}
        </label>
      </div>
      <p id={`${id}-purpose`} className="pl-8 text-body-sm text-text-secondary">
        {t('consentPurpose')}
      </p>
      {error && (
        <p id={`${id}-error`} className="pl-8 text-body-sm text-danger">
          {t(`errors.${medicalProfileErrorKey(error)}`)}
        </p>
      )}
    </div>
  );
}
