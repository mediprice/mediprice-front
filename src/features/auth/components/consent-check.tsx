import { useTranslations } from 'next-intl';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** 동의 항목 한 줄. 문서 링크는 체크 영역 밖에 두어 링크를 눌러도 체크가 바뀌지 않는다. */
export function ConsentCheck({
  id,
  label,
  isRequired = false,
  isLarge = false,
  hint,
  children,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'id' | 'type' | 'className'> & {
  id: string;
  label: string;
  isRequired?: boolean;
  /** "모두 동의"처럼 묶음을 대표하는 줄. */
  isLarge?: boolean;
  hint?: string;
  /** 체크 아래에 붙는 링크·고지. */
  children?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('auth.consent');
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-3"
      >
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'mt-0.5 size-5 shrink-0 cursor-pointer accent-primary',
            isLarge && 'size-6',
          )}
          {...props}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {isRequired && (
              <span className="rounded-md bg-primary-tint px-1.5 py-0.5 text-caption-bold text-primary-text">
                {t('required')}
              </span>
            )}
            <span
              className={cn(
                'text-body text-text-primary',
                isLarge && 'text-subheading',
              )}
            >
              {label}
            </span>
          </span>
          {hint && (
            <span
              id={`${id}-hint`}
              className="text-body-sm text-text-secondary"
            >
              {hint}
            </span>
          )}
        </span>
      </label>
      {children && (
        <div className="flex flex-col gap-2 pl-8 max-[22rem]:pl-0">
          {children}
        </div>
      )}
    </div>
  );
}
