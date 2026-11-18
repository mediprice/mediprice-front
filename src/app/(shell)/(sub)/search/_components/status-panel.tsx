import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** 결과 없음·조회 실패·입력 안내. 모바일은 흰 바탕 가운데, lg부터 회색 패널이다. 행동 버튼은 모바일에서 꽉 찬 폭이다. */
export function StatusPanel({
  icon,
  title,
  titleAs: Title = 'h2',
  description,
  actions,
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'title'> & {
  icon: ReactNode;
  title: string;
  titleAs?: 'h1' | 'h2';
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 py-14 text-center lg:rounded-xl lg:bg-surface lg:px-8 lg:py-12',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="mb-1 flex size-16 items-center justify-center rounded-full bg-surface-strong text-text-secondary lg:bg-primary-tint lg:text-primary [&_svg]:size-7 [&_svg]:[stroke-width:1.75]"
      >
        {icon}
      </span>
      <Title className="text-section text-balance">{title}</Title>
      {description && (
        <p className="max-w-md text-body-sm text-text-secondary">
          {description}
        </p>
      )}
      {actions && (
        <div className="mt-3 flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:justify-center">
          {actions}
        </div>
      )}
    </div>
  );
}
