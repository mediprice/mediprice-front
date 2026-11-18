import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** 분류 이름 같은 작은 회색 꼬리표(Figma "분류"). 누를 수 없는 표시용이다. */
export function Tag({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="tag"
      className={cn(
        'inline-flex items-center rounded-md bg-surface-strong px-2 py-1 text-caption-strong text-text-secondary',
        className,
      )}
      {...props}
    />
  );
}
