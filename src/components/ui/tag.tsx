import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const tagVariants = cva(
  'inline-flex items-center rounded-md px-2 py-1 text-caption-strong text-text-secondary',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-strong',
        onBand: 'bg-bg',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

/** 분류 이름 같은 작은 꼬리표. 누를 수 없는 표시용이다. 색 띠(머리 영역) 위에서는 tone="onBand"를 쓴다. */
export function Tag({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof tagVariants>) {
  return (
    <span
      data-slot="tag"
      className={cn(tagVariants({ tone }), className)}
      {...props}
    />
  );
}
