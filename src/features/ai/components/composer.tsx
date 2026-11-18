'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mic, SendHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type KeyboardEvent, type RefObject, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';

import { MAX_INPUT_LENGTH, turnInputSchema } from '../schemas';

const composerSchema = z.object({ input: turnInputSchema });
const COUNTER_FROM = MAX_INPUT_LENGTH - 100;

/** 대화 입력창. Enter로 보내고 Shift+Enter는 줄바꿈이다(한글 조합 중 Enter는 무시). */
export function Composer({
  textareaRef,
  isSending,
  isDisabled,
  disabledPlaceholder,
  onSend,
  onMic,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  isSending: boolean;
  /** 대화가 끝났거나 오늘 한도를 다 써서 더 보낼 수 없을 때. */
  isDisabled: boolean;
  /** 막혔을 때 입력창에 보일 이유. */
  disabledPlaceholder?: string;
  /** 보냈으면 true. 입력창은 그때만 비운다. */
  onSend: (text: string) => boolean;
  /** 음성 입력을 쓸 수 없는 브라우저면 넘기지 않는다. */
  onMic?: () => void;
}) {
  const t = useTranslations('ai.composer');
  const inputId = useId();
  const counterId = useId();
  const { register, handleSubmit, reset, control } = useForm({
    resolver: zodResolver(composerSchema),
    defaultValues: { input: '' },
  });
  const value = useWatch({ control, name: 'input' });
  const canSubmit = !isDisabled && value.trim().length > 0;
  const { ref, ...field } = register('input');

  const submit = handleSubmit(({ input }) => {
    if (onSend(input)) reset();
  });

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submit();
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="flex items-end gap-2 border-t border-border bg-bg px-4 py-2.5 lg:mx-8 lg:mb-7 lg:rounded-lg lg:border-t-0 lg:p-2.5"
    >
      <label htmlFor={inputId} className="sr-only">
        {t('label')}
      </label>
      <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-3xl bg-surface-strong px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring lg:rounded-md lg:bg-transparent lg:px-2">
        <textarea
          id={inputId}
          {...field}
          ref={(element) => {
            ref(element);
            textareaRef.current = element;
          }}
          rows={1}
          maxLength={MAX_INPUT_LENGTH}
          enterKeyHint="send"
          autoComplete="off"
          disabled={isDisabled}
          placeholder={
            isDisabled ? (disabledPlaceholder ?? t('placeholder')) : t('placeholder')
          }
          aria-describedby={
            value.length >= COUNTER_FROM ? counterId : undefined
          }
          onKeyDown={handleKeyDown}
          className="field-sizing-content max-h-32 min-h-6 w-full resize-none bg-transparent py-2.5 text-field text-text-primary placeholder:text-text-tertiary focus-visible:outline-none disabled:cursor-not-allowed"
        />
        {value.length >= COUNTER_FROM && (
          <p
            id={counterId}
            className="pb-1.5 text-right text-caption text-text-tertiary tabular-nums"
          >
            {t('counter', { count: value.length, max: MAX_INPUT_LENGTH })}
          </p>
        )}
      </div>
      {onMic && !isDisabled && (
        <Button
          variant="tint"
          size="icon"
          aria-label={t('mic')}
          onClick={onMic}
          className="rounded-full lg:rounded-lg"
        >
          <Mic aria-hidden="true" />
        </Button>
      )}
      <Button
        type="submit"
        size="icon"
        aria-label={t('send')}
        isLoading={isSending}
        disabled={!canSubmit}
        className="rounded-full lg:w-auto lg:rounded-lg lg:px-5"
      >
        <SendHorizontal aria-hidden="true" className="lg:hidden" />
        <span aria-hidden="true" className="hidden lg:inline">
          {t('send')}
        </span>
      </Button>
    </form>
  );
}
