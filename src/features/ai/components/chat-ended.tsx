import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

/** 한 대화에서 말할 수 있는 횟수를 다 썼을 때. */
export function ChatEnded({ onRestart }: { onRestart: () => void }) {
  const t = useTranslations('ai.ended');
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-3 text-caption-strong text-text-tertiary before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        {t('divider')}
      </p>
      <p className="text-center text-body-sm text-text-secondary">
        {t('description')}
      </p>
      <div className="flex flex-col gap-2 lg:flex-row lg:justify-center">
        <Button size="md" onClick={onRestart}>
          {t('restart')}
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href={{ pathname: '/search', query: { category: 'all' } }}>
            {t('category')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
