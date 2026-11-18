import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** 불러오는 동안 자리를 잡아 레이아웃이 흔들리지 않게 한다. 크기는 className으로 준다. */
export function Skeleton({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        'block animate-pulse rounded-md bg-surface-strong',
        className,
      )}
      {...props}
    />
  );
}
