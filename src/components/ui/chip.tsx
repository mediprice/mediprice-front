'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Figma M/Chip. 고른 칩은 색과 함께 굵기도 바뀐다. 보이는 높이는 36px이고 누르는 영역은 44px이다. */
const chipVariants = cva(
  [
    'touch-target inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-3.5 whitespace-nowrap',
    'transition-colors duration-150 ease-standard motion-reduce:transition-none',
  ],
  {
    variants: {
      selected: {
        true: 'border-primary bg-primary-tint text-label text-primary-text',
        false:
          'border-border bg-bg text-body-sm text-text-secondary hover:bg-surface active:bg-surface-strong',
      },
    },
    defaultVariants: { selected: false },
  },
);

export function Chip({
  className,
  selected,
  asChild = false,
  type,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof chipVariants> & { asChild?: boolean }) {
  const classes = cn(chipVariants({ selected }), className);
  if (asChild) {
    return <Slot.Root data-slot="chip" className={classes} {...props} />;
  }
  return (
    <button
      data-slot="chip"
      type={type ?? 'button'}
      aria-pressed={selected ?? false}
      className={classes}
      {...props}
    />
  );
}
