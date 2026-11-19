'use client';

import { useQueries } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { npayQueries } from '@/features/npay/queries';
import { ApiError } from '@/lib/api/errors';

import { areaScope } from '../area-filters';
import type { AssistantMessage } from '../conversation';
import { resolveResultState } from '../result-state';
import { AssistantBubble } from './assistant-bubble';
import { NoMatchLinks } from './no-match-links';
import { ResultList } from './result-list';

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
  const result = resolveResultState(
    message.items,
    details.map((query) => ({
      data: query.data,
      isPending: query.isPending,
      isError: query.isError,
      isMissing: query.error instanceof ApiError && query.error.status === 404,
    })),
  );

  if (result.kind === 'missing') {
    return (
      <AssistantBubble text={t('noMatch.reply')}>
        {isActive && <NoMatchLinks />}
      </AssistantBubble>
    );
  }
  if (result.kind === 'loadError') {
    return (
      <AssistantBubble text={t('result.loadError')}>
        <Button
          variant="tint"
          size="md"
          className="w-fit"
          onClick={() =>
            details.forEach((query) => {
              if (query.isError) void query.refetch();
            })
          }
        >
          <RotateCcw aria-hidden="true" />
          {t('failure.retry')}
        </Button>
      </AssistantBubble>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AssistantBubble text={message.text} />
      <ResultList
        entries={result.entries}
        pendingCount={result.pendingCount}
        scope={areaScope(message.area)}
        actions={isActive ? { onAskMore, onRestart } : undefined}
      />
    </div>
  );
}
