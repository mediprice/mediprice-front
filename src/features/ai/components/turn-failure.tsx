import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Chip } from '@/components/ui/chip';

import type { TurnFailure as Failure } from '../ai-errors';
import { AssistantBubble } from './assistant-bubble';

/** 답을 받지 못했을 때. 다시 보내기는 같은 입력과 같은 대화 상태를 다시 보낸다. */
export function TurnFailure({
  failure,
  onRetry,
}: {
  failure: Failure;
  onRetry?: () => void;
}) {
  const t = useTranslations('ai.failure');
  return (
    <AssistantBubble text={t(failure)}>
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <Chip onClick={onRetry} aria-pressed={undefined}>
            <RotateCcw
              aria-hidden="true"
              className="size-4"
              strokeWidth={1.75}
            />
            {t('retry')}
          </Chip>
        )}
        <Chip asChild>
          <Link href="/search">{t('search')}</Link>
        </Chip>
      </div>
    </AssistantBubble>
  );
}
