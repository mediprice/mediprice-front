import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** 분류 이름 같은 작은 꼬리표. 누를 수 없는 표시용이다. 색 띠(머리 영역) 위에서는 tone="onBand"를 쓴다. */
export function Tag({
  className,
  tone = 'neutral',
  ...props
}: ComponentProps<'span'> & { tone?: 'neutral' | 'onBand' }) {
  return (
    <span
      data-slot="tag"
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-caption-strong text-text-secondary',
        tone === 'onBand' ? 'bg-bg' : 'bg-surface-strong',
        className,
      )}
      {...props}
    />
  );
}
