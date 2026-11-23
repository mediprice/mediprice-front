import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** 결과 없음·조회 실패·로그인 필요 같은 빈 화면의 유일한 형태. 행동은 tint md 버튼 하나를 주로, 더 있으면 ghost 버튼을 아래로 쌓는다. 문구는 호출하는 쪽이 번역해서 넘긴다. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  titleAs: Title = 'p',
  className,
  ...props
}: Omit<ComponentProps<'div'>, 'title'> & {
  icon?: ReactNode;
  title: string;
  /** 화면 전체가 빈 상태(404·오류 페이지)면 'h1'로 넘겨 제목 구조를 지킨다. */
  titleAs?: 'p' | 'h1' | 'h2';
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center gap-3 px-4 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-surface text-text-tertiary [&_svg]:size-7 [&_svg]:[stroke-width:1.75]"
        >
          {icon}
        </span>
      )}
      <Title className="text-subheading">{title}</Title>
      {description && (
        <p className="max-w-sm text-body-sm text-text-secondary">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2 flex w-full max-w-xs flex-col items-stretch gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
