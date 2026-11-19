import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** 말풍선 옆 "AI" 글자 아바타. 장식이라 낭독하지 않고, 말한 사람은 말풍선 안 sr-only 글자로 알린다. */
export function AiAvatar({ className }: { className?: string }) {
  const t = useTranslations('ai.log');
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-text-primary text-caption-bold text-on-primary',
        className,
      )}
    >
      {t('avatar')}
    </span>
  );
}
