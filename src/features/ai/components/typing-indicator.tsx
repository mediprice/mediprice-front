import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { AssistantBubble } from './assistant-bubble';

const DOT_DELAYS = [
  '[animation-delay:0ms]',
  '[animation-delay:200ms]',
  '[animation-delay:400ms]',
];

/** 답을 기다리는 동안의 말풍선. 상태를 알리는 움직임이라 동작 줄이기 설정에서도 남긴다. */
export function TypingIndicator() {
  const t = useTranslations('ai.log');
  return (
    <div role="status">
      <AssistantBubble
        text={
          <>
            <span className="sr-only">{t('typing')}</span>
            <span aria-hidden="true" className="flex h-6 items-center gap-1.5">
              {DOT_DELAYS.map((delay) => (
                <span
                  key={delay}
                  data-allow-motion
                  className={cn(
                    'size-2 animate-pulse rounded-full bg-border-strong',
                    delay,
                  )}
                />
              ))}
            </span>
          </>
        }
      />
    </div>
  );
}
