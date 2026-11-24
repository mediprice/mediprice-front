'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import type { TurnQuestion } from '@/features/ai/schemas';

import { type DailyUsage, SendCostHint } from './send-cost-hint';

/** 질문이 하나면 고르는 즉시 보내고, 둘이면 각각 고른 뒤 한 번에 보낸다. 어느 쪽이든 보내면 1회 쓴다고 알린다. */
export function QuestionOptions({
  questions,
  onAnswer,
  usage,
}: {
  questions: TurnQuestion[];
  onAnswer: (text: string) => void;
  usage: DailyUsage;
}) {
  const t = useTranslations('ai.questions');
  const baseId = useId();
  const [selected, setSelected] = useState<Record<number, string | undefined>>(
    {},
  );
  const isSingle = questions.length === 1;
  const answers = questions
    .map((_, index) => selected[index])
    .filter((answer): answer is string => answer !== undefined);

  function handlePick(index: number, option: string) {
    if (isSingle) {
      onAnswer(option);
      return;
    }
    setSelected((current) => ({
      ...current,
      [index]: current[index] === option ? undefined : option,
    }));
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.map((question, index) => {
        const labelId = `${baseId}-${index}`;
        return (
          <div
            key={question.about || index}
            role="group"
            aria-labelledby={labelId}
            className="flex flex-col gap-2"
          >
            <p id={labelId} className="text-label-bold text-text-secondary">
              {question.text}
            </p>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <Chip
                  key={option}
                  selected={isSingle ? undefined : selected[index] === option}
                  aria-pressed={
                    isSingle ? undefined : selected[index] === option
                  }
                  onClick={() => handlePick(index, option)}
                  className="h-auto min-h-9 py-1.5 whitespace-normal"
                >
                  {option}
                </Chip>
              ))}
            </div>
          </div>
        );
      })}
      {!isSingle && (
        <Button
          size="md"
          variant="tint"
          className="w-fit"
          disabled={answers.length === 0}
          onClick={() => onAnswer(answers.join(', '))}
        >
          {t('sendSelected')}
        </Button>
      )}
      <p className="text-caption text-text-tertiary">
        <SendCostHint usage={usage} isInstant={isSingle} />
      </p>
    </div>
  );
}
