'use client';

import { useQueries } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { npayQueries } from '@/features/npay/queries';
import { ApiError } from '@/lib/api/errors';

import type { AssistantMessage } from '../conversation';
import { AssistantBubble } from './assistant-bubble';
import { NoMatchLinks } from './no-match-links';
import { ResultList } from './result-list';

/** AI가 고른 코드 중 공개 데이터에 없는 것(404)은 빼고, 하나도 남지 않으면 "찾지 못함"으로 보여 준다. */
export function ResultMessage({
  message,
  isActive,
  onAskMore,
  onRestart,
}: {
  message: AssistantMessage;
  isActive: boolean;
  onAskMore: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations('ai');
  const details = useQueries({
    queries: message.items.map((item) => npayQueries.detail(item.code)),
  });
  const entries = message.items.flatMap((item, index) => {
    const detail = details[index]?.data;
    return detail ? [{ item, detail }] : [];
  });
  const pendingCount = details.filter((query) => query.isPending).length;
  const failed = details.filter((query) => query.isError);

  if (entries.length === 0 && pendingCount === 0) {
    const isMissing = failed.every(
      (query) => query.error instanceof ApiError && query.error.status === 404,
    );
    if (isMissing) {
      return (
        <AssistantBubble text={t('noMatch.reply')}>
          {isActive && <NoMatchLinks />}
        </AssistantBubble>
      );
    }
    return (
      <AssistantBubble text={t('result.loadError')}>
        <Button
          variant="tint"
          size="md"
          className="w-fit"
          onClick={() => failed.forEach((query) => void query.refetch())}
        >
          <RotateCcw aria-hidden="true" />
          {t('failure.retry')}
        </Button>
      </AssistantBubble>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AssistantBubble text={message.text} />
      <ResultList
        entries={entries}
        pendingCount={pendingCount}
        actions={isActive ? { onAskMore, onRestart } : undefined}
      />
    </div>
  );
}
