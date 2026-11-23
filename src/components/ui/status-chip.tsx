import { cva, type VariantProps } from 'class-variance-authority';
import { Check, TriangleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const statusChipVariants = cva(
  'inline-flex w-fit items-center gap-1 rounded-full py-1 pr-2.5 pl-2 text-caption-strong [&_svg]:size-3 [&_svg]:shrink-0 [&_svg]:[stroke-width:1.5]',
  {
    variants: {
      status: {
        positive: 'bg-positive-tint text-positive',
        warning: 'bg-warning-tint text-warning',
      },
    },
    defaultVariants: { status: 'positive' },
  },
);

/** Figma M/StatusChip. 색만으로 구분하지 않도록 상태마다 아이콘을 함께 보여 준다. */
export function StatusChip({
  className,
  status,
  children,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof statusChipVariants>) {
  return (
    <span
      data-slot="status-chip"
      className={cn(statusChipVariants({ status }), className)}
      {...props}
    >
      {status === 'warning' ? (
        <TriangleAlert aria-hidden="true" />
      ) : (
        <Check aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
