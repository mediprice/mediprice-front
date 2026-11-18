'use client';

import { useFormatter } from 'next-intl';
import { type ReactNode, useEffect, useState } from 'react';

import { useFirstView } from '@/lib/motion/use-first-view';
import { cn } from '@/lib/utils';

import { ROLL_DURATION_MS, rollingValueAt } from './rolling-value';

/**
 * 처음 보일 때 0에서 value까지 굴러 올라가는 숫자. value가 바뀌면 다시 굴린다.
 * 접근성 이름은 최종값(sr-only)이고 움직이는 숫자는 aria-hidden이다. 서버 렌더·reduced-motion은 최종값 그대로다.
 * 가격은 format으로 문구를 넘긴다: format={(n) => t('won', { amount: n })}.
 */
export function RollingNumber({
  value,
  format,
  className,
}: {
  value: number;
  format?: (value: number) => ReactNode;
  className?: string;
}) {
  const formatter = useFormatter();
  const render = format ?? ((n: number) => formatter.number(n));
  const [ref, phase] = useFirstView<HTMLSpanElement>({ playIfVisible: true });
  const [rolled, setRolled] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const progress = (now - start) / ROLL_DURATION_MS;
      setRolled(rollingValueAt(progress, 0, value));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, value]);

  const shown = phase === 'static' ? value : phase === 'waiting' ? 0 : rolled;

  return (
    <span
      ref={ref}
      data-slot="rolling-number"
      className={cn('inline-grid tabular-nums', className)}
    >
      <span className="sr-only">{render(value)}</span>
      {/** 최종값 너비를 미리 잡아 숫자가 커지는 동안 옆 글자가 밀리지 않게 한다. */}
      <span aria-hidden="true" className="col-start-1 row-start-1 opacity-0">
        {render(value)}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1">
        {render(shown)}
      </span>
    </span>
  );
}
