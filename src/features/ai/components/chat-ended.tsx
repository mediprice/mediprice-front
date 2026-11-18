import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

import { SESSION_TURN_LIMIT } from '../conversation';

/** 한 대화에서 말할 수 있는 횟수를 다 썼을 때. 새 대화를 앞세우고 카테고리는 ghost 보조로 둔다. */
export function ChatEnded({ onRestart }: { onRestart: () => void }) {
  const t = useTranslations('ai.ended');
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-5 py-6 text-center">
      <h2 className="text-heading text-balance">{t('divider')}</h2>
      <p className="max-w-md text-body text-text-secondary">
        {t('description', { count: SESSION_TURN_LIMIT })}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button size="md" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          {t('restart')}
        </Button>
        <Button asChild variant="ghost" size="md">
          <Link href={{ pathname: '/search', query: { category: 'all' } }}>
            {t('category')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
