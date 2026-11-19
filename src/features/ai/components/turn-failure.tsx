import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

import type { TurnFailure as Failure } from '../ai-errors';
import { AssistantBubble } from './assistant-bubble';

/** 답을 받지 못했을 때. 다시 보내기는 같은 입력과 같은 대화 상태를 다시 보낸다. 재시도가 없으면 검색을 tint로 앞세운다. */
export function TurnFailure({
  failure,
  onRetry,
}: {
  /** resumeAfterLogin은 비회원 한도에 걸린 뒤 로그인했을 때다. */
  failure: Failure | 'resumeAfterLogin';
  onRetry?: () => void;
}) {
  const t = useTranslations('ai.failure');
  return (
    <AssistantBubble text={t(failure)}>
      <div className="flex flex-col items-start gap-1">
        {onRetry && (
          <Button variant="tint" size="md" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            {t('retry')}
          </Button>
        )}
        <Button asChild variant={onRetry ? 'ghost' : 'tint'} size="md">
          <Link href="/search">{t('search')}</Link>
        </Button>
      </div>
    </AssistantBubble>
  );
}
