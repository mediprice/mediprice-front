import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

import { SESSION_TURN_LIMIT } from '../conversation';

/** 한 대화에서 말할 수 있는 횟수를 다 썼을 때. 행동은 빈 상태 규칙대로 tint 하나와 ghost 보조다. */
export function ChatEnded({ onRestart }: { onRestart: () => void }) {
  const t = useTranslations('ai.ended');
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="flex w-full items-center gap-3 text-caption-strong text-text-tertiary before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        {t('divider')}
      </p>
      <p className="text-body-sm text-text-secondary">
        {t('description', { count: SESSION_TURN_LIMIT })}
      </p>
      <div className="flex flex-col items-center gap-1">
        <Button variant="tint" size="md" onClick={onRestart}>
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
