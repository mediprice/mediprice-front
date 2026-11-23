'use client';

import { Slot } from 'radix-ui';
import type { ComponentProps, CSSProperties } from 'react';

import { useFirstView } from '@/lib/motion/use-first-view';
import { cn } from '@/lib/utils';

/**
 * 스크롤로 처음 보일 때 12px 아래에서 떠오르며 나타난다. 서버 렌더와 JS가 없을 때, 이미 화면에 보이는 것,
 * reduced-motion이면 그대로 보인다. 목록은 delayMs로 차례를 준다.
 */
export function Reveal({
  asChild = false,
  delayMs,
  className,
  style,
  ...props
}: Omit<ComponentProps<'div'>, 'ref'> & {
  asChild?: boolean;
  delayMs?: number;
}) {
  const [ref, phase] = useFirstView<HTMLDivElement>();
  const Comp = asChild ? Slot.Root : 'div';
  /** CSSProperties는 사용자 정의 속성(--reveal-delay)을 모르므로 단언한다. */
  const delayedStyle = delayMs
    ? ({ ...style, '--reveal-delay': `${delayMs}ms` } as CSSProperties)
    : style;
  return (
    <Comp
      ref={ref}
      data-slot="reveal"
      data-reveal={phase}
      style={delayedStyle}
      className={cn(
        'data-[reveal=waiting]:translate-y-3 data-[reveal=waiting]:opacity-0',
        'data-[reveal=playing]:transition-[opacity,translate] data-[reveal=playing]:delay-(--reveal-delay) data-[reveal=playing]:duration-400 data-[reveal=playing]:ease-enter',
        className,
      )}
      {...props}
    />
  );
}
