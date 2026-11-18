import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** AI 말풍선. 아바타 오른쪽에 말풍선을, 그 아래(아바타 폭만큼 들여서)에 선택지·결과 같은 children을 둔다. */
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
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-end gap-2">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-caption-bold text-on-primary"
        >
          {t('avatar')}
        </span>
        <div className="max-w-[min(100%,36rem)] min-w-0 rounded-2xl rounded-bl-md border border-border bg-bg px-3.5 py-2.5 text-body whitespace-pre-line">
          <span className="sr-only">{t('assistant')} </span>
          {text}
        </div>
      </div>
      {children && <div className="flex flex-col gap-3 pl-9">{children}</div>}
    </div>
  );
}
