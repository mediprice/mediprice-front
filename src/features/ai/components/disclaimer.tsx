import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/** 진단·치료 추천이 아니라는 안내. 데스크톱은 대화 위에 고정하고, 모바일은 큰 글자에서도 대화 칸이 남도록 대화 맨 위에 두어 함께 스크롤된다. */
export function Disclaimer({ className }: { className?: string }) {
  const t = useTranslations('ai.header');
  return (
    <p
      className={cn(
        'flex gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-body-sm text-text-secondary',
        className,
      )}
    >
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4.5 shrink-0 text-text-tertiary"
        strokeWidth={1.75}
      />
      {t('disclaimer')}
    </p>
  );
}
