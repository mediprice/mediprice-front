'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps, MouseEvent } from 'react';

import { cn } from '@/lib/utils';

/** 변형 이름은 Figma M/Button 변형을 따른다. 긴 문구는 줄바꿈되고, 모바일 전체 폭은 className="w-full"로 준다. */
const buttonVariants = cva(
  [
    'relative inline-flex max-w-full shrink-0 items-center justify-center gap-2 rounded-lg text-center text-label-bold text-balance',
    'transition-[color,background-color,border-color,box-shadow] duration-150 ease-standard motion-reduce:transition-none',
    'data-loading:pointer-events-none inactive:pointer-events-none inactive:text-text-disabled inactive:shadow-none',
    '[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:[stroke-width:1.75]',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed inactive:bg-surface-strong',
        tint: 'bg-primary-tint text-primary-text hover:bg-primary-tint-hover active:bg-primary-tint-pressed inactive:bg-surface-strong',
        neutral:
          'bg-surface text-text-primary hover:bg-surface-strong active:bg-border inactive:bg-surface-strong',
        outline:
          'border border-border-strong bg-bg text-text-primary hover:bg-surface active:bg-surface-strong inactive:border-border',
        danger:
          'bg-danger text-on-primary hover:bg-danger-hover active:bg-danger-pressed inactive:bg-surface-strong',
        dangerText:
          'bg-surface text-danger hover:bg-surface-strong active:bg-border inactive:bg-surface-strong',
        ghost:
          'text-primary-text hover:bg-primary-tint active:bg-primary-tint-hover',
        onTint:
          'bg-bg text-primary-text hover:bg-surface active:bg-surface-strong inactive:bg-surface-strong',
      },
      size: {
        lg: 'min-h-13 px-5 py-3',
        md: 'min-h-11 px-4 py-2.5',
        sm: 'touch-target min-h-9 px-3 py-1.5',
        icon: 'size-11',
      },
      /** 화면의 대표 행동 하나(페이지 CTA, 하단 고정 버튼)에만 쓴다. */
      elevated: { true: 'shadow-cta-glow', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'lg', elevated: false },
  },
);

export function Button({
  className,
  variant,
  size,
  elevated,
  asChild = false,
  isLoading = false,
  type,
  onClick,
  children,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** 너비·색·포커스를 유지한 채 스피너를 보여주고 클릭을 막는다. asChild와 함께 쓰지 않는다. */
    isLoading?: boolean;
  }) {
  const classes = cn(buttonVariants({ variant, size, elevated }), className);

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        className={classes}
        onClick={onClick}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  /** disabled로 막으면 포커스가 사라지므로 로딩 중에는 aria-disabled와 클릭 차단을 쓴다. */
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      data-slot="button"
      type={type ?? 'button'}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      data-loading={isLoading || undefined}
      onClick={handleClick}
      className={classes}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-flex items-center gap-2 opacity-0">
            {children}
          </span>
          <LoaderCircle
            aria-hidden="true"
            data-allow-motion
            className="absolute animate-spin"
          />
        </>
      ) : (
        children
      )}
    </button>
  );
}
