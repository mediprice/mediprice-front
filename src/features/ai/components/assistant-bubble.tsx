import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { AiAvatar } from './ai-avatar';

/** AI 말풍선. 아바타 오른쪽에 말풍선을, 그 아래(아바타 폭만큼 들여서)에 선택지·안내 같은 children을 둔다. */
export function AssistantBubble({
  text,
  children,
  className,
}: {
  text: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('ai.log');
  return (
    <div
      className={cn(
        'flex flex-col gap-3 transition-[opacity,translate] duration-300 ease-enter starting:translate-y-3 starting:opacity-0',
        className,
      )}
    >
      <div className="flex items-start gap-2.5 @max-xs:flex-col">
        <AiAvatar />
        <div className="max-w-[min(100%,36rem)] min-w-0 rounded-3xl rounded-tl-md bg-surface px-4 py-3 text-body whitespace-pre-line text-text-primary">
          <span className="sr-only">{t('assistant')} </span>
          {text}
        </div>
      </div>
      {children && (
        <div className="flex flex-col gap-3 pl-10.5 @max-xs:pl-0">
          {children}
        </div>
      )}
    </div>
  );
}
