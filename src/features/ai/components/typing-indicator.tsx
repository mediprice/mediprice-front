import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { AssistantBubble } from './assistant-bubble';

const DOT_DELAYS = [
  '[animation-delay:0ms]',
  '[animation-delay:200ms]',
  '[animation-delay:400ms]',
];

/** 답을 기다리는 동안의 말풍선. 점은 장식이고 기다리는 중이라는 것은 글자로 알린다. 동작 줄이기 설정이면 점은 멈춘다. */
export function TypingIndicator() {
  const t = useTranslations('ai.log');
  return (
    <div role="status">
      <AssistantBubble
        text={
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-6 items-center gap-1.5">
              {DOT_DELAYS.map((delay) => (
                <span
                  key={delay}
                  className={cn(
                    'size-2 animate-pulse rounded-full bg-text-tertiary motion-reduce:animate-none',
                    delay,
                  )}
                />
              ))}
            </span>
            <span className="text-body-sm text-text-secondary">
              {t('typing')}
            </span>
          </span>
        }
      />
    </div>
  );
}
