import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { msUntilNextStage, type WaitStage, waitStage } from '../wait-stage';
import { AssistantBubble } from './assistant-bubble';

const DOT_DELAYS = [
  '[animation-delay:0ms]',
  '[animation-delay:200ms]',
  '[animation-delay:400ms]',
];

/** 보낸 시각부터 센 기다림 단계. 다음 단계가 될 때만 다시 그린다. */
function useWaitStage(sentAt: number | null): WaitStage {
  const [now, setNow] = useState(() => Date.now());
  const elapsed = sentAt === null ? 0 : now - sentAt;
  const wait = msUntilNextStage(elapsed);
  useEffect(() => {
    if (wait === null) return;
    const id = setTimeout(() => setNow(Date.now()), wait);
    return () => clearTimeout(id);
  }, [wait]);
  return waitStage(elapsed);
}

/** 답을 기다리는 동안의 말풍선. 8초부터 걸리는 시간을 알리고 30초부터 그만둘 수 있다. 점은 상태를 알리는 움직임이라 동작 줄이기 설정에서도 남긴다. */
export function TypingIndicator({
  sentAt,
  onCancel,
}: {
  sentAt: number | null;
  onCancel: () => void;
}) {
  const t = useTranslations('ai');
  const stage = useWaitStage(sentAt);
  const [isKept, setIsKept] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const message =
    stage === 'slow'
      ? t('wait.slow')
      : stage === 'long'
        ? isKept
          ? t('wait.kept')
          : t('wait.long')
        : null;

  return (
    <AssistantBubble
      text={
        <span role="status" className="flex flex-col gap-1">
          <span className="sr-only">{t('log.typing')}</span>
          <span aria-hidden="true" className="flex h-6 items-center gap-1.5">
            {DOT_DELAYS.map((delay) => (
              <span
                key={delay}
                className={cn(
                  'size-2 animate-pulse rounded-full bg-border-strong',
                  delay,
                )}
              />
            ))}
          </span>
          {message && (
            <span className="text-body-sm text-text-secondary">{message}</span>
          )}
        </span>
      }
    >
      {stage === 'long' && (
        <div className="flex flex-wrap gap-2">
          {!isKept && (
            <Button
              variant="tint"
              size="md"
              onClick={() => {
                setIsKept(true);
                cancelRef.current?.focus();
              }}
            >
              {t('wait.keepWaiting')}
            </Button>
          )}
          <Button
            ref={cancelRef}
            variant={isKept ? 'ghost' : 'outline'}
            size="md"
            onClick={onCancel}
          >
            {t('wait.cancel')}
          </Button>
        </div>
      )}
    </AssistantBubble>
  );
}
