'use client';

import { Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

const UNDO_MS = 6000;

/**
 * 뺀 카드 자리에 잠깐 남는 "관심에서 뺐어요 · 되돌리기" 줄. 시간이 지나면 사라지지만,
 * 마우스를 올리거나 키보드로 포커스한 동안에는 멈춘다(WCAG 2.2.1).
 */
export function RemovedFavoriteRow({
  name,
  onUndo,
  onExpire,
}: {
  name: string;
  onUndo: () => void;
  /** 사라질 때 이 줄에 포커스가 있었으면 true. 부모가 포커스를 옮긴다. */
  onExpire: (hadFocus: boolean) => void;
}) {
  const t = useTranslations('library.favorites');
  const rowRef = useRef<HTMLDivElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const isPaused = isHovered || isKeyboardFocused;

  /** 뺀 카드 자리라 포커스를 이어받는다. onFocus가 키보드 포커스인지 판단한다. */
  useEffect(() => {
    undoRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setTimeout(() => {
      onExpire(rowRef.current?.contains(document.activeElement) ?? false);
    }, UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [isPaused, onExpire]);

  return (
    <div
      ref={rowRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={(event) =>
        setIsKeyboardFocused(event.target.matches(':focus-visible'))
      }
      onBlur={() => setIsKeyboardFocused(false)}
      className="flex min-h-16 items-center gap-3 rounded-xl border border-dashed border-border-strong bg-bg py-2 pr-2 pl-4 lg:min-h-20 lg:pl-6"
    >
      <p className="min-w-0 flex-1 text-body-sm text-text-secondary">
        {t.rich('removedInline', {
          name,
          strong: (chunks) => (
            <strong className="text-label-bold text-text-primary">
              {chunks}
            </strong>
          ),
        })}
      </p>
      <Button
        ref={undoRef}
        variant="ghost"
        size="md"
        aria-label={t('undoLabel', { name })}
        onClick={onUndo}
      >
        <Undo2 aria-hidden="true" />
        {t('undo')}
      </Button>
    </div>
  );
}
