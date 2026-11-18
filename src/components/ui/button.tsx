import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** 변형 이름은 Figma M/Button 변형과 같다. 모바일 전체 폭은 className="w-full"로 준다. */
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-label-bold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:bg-surface-strong disabled:text-text-disabled disabled:shadow-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-on-primary shadow-cta-glow hover:bg-primary-hover active:bg-primary-pressed',
        tint: 'bg-primary-tint text-primary-text hover:bg-primary-tint-hover active:bg-primary-tint-hover',
        neutral:
          'bg-surface text-text-primary hover:bg-surface-strong active:bg-surface-strong',
        dangerText:
          'bg-surface text-danger hover:bg-surface-strong active:bg-surface-strong',
        ghost: 'text-primary-text hover:bg-primary-tint active:bg-primary-tint',
        onTint: 'bg-bg text-primary-text hover:bg-surface active:bg-surface',
      },
      size: {
        lg: 'h-12 px-5',
        md: 'h-11 px-5',
        sm: 'h-10 px-4',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'lg' },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      type={asChild ? type : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
