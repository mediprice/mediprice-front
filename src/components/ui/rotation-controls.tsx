'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { useRotation } from '@/lib/motion/use-rotation';
import { cn } from '@/lib/utils';

import { Button } from './button';

/** useRotation과 짝인 멈춤·이전·다음 버튼과 위치 점. 점은 장식이고 위치는 sr-only로 읽는다. */
export function RotationControls({
  rotation,
  count,
  showPrev = false,
  className,
}: {
  rotation: ReturnType<typeof useRotation>;
  count: number;
  showPrev?: boolean;
  className?: string;
}) {
  const t = useTranslations('common.rotation');
  if (count < 2) return null;
  return (
    <div
      data-slot="rotation-controls"
      className={cn('flex items-center gap-1', className)}
    >
      <p className="sr-only" aria-live={rotation.paused ? 'polite' : 'off'}>
        {t('position', { current: rotation.index + 1, total: count })}
      </p>
      <span aria-hidden="true" className="mr-2 flex items-center gap-1.5">
        {Array.from({ length: count }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 rounded-full transition-[width,background-color] duration-300 ease-standard',
              index === rotation.index
                ? 'w-4 bg-primary'
                : 'w-1.5 bg-border-strong',
            )}
          />
        ))}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={rotation.isUserPaused ? t('play') : t('pause')}
        onClick={rotation.toggle}
      >
        {rotation.isUserPaused ? (
          <Play aria-hidden="true" />
        ) : (
          <Pause aria-hidden="true" />
        )}
      </Button>
      {showPrev && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('prev')}
          onClick={rotation.prev}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('next')}
        onClick={rotation.next}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
