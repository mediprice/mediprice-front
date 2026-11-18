'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUp, Mic } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type KeyboardEvent, type RefObject, useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      className={cn(
        'border-t border-hairline bg-bg pt-2.5 px-page pb-3 lg:px-8 lg:pt-4 lg:pb-6',
        /** 낮은 화면에서는 창이 스크롤되므로 입력창을 탭바 바로 위(입력 중에는 화면 맨 아래)에 붙인다. */
        '[@media(max-height:36rem)]:sticky [@media(max-height:36rem)]:bottom-[calc(var(--spacing-tab-bar)+env(safe-area-inset-bottom,0px))] [@media(max-height:36rem)]:has-[textarea:focus]:bottom-0 lg:[@media(max-height:36rem)]:bottom-0',
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        {t('label')}
      </label>
      <div className="flex flex-wrap items-end gap-1 rounded-3xl border border-border-strong bg-bg p-1.5 pl-4 transition-colors duration-200 ease-standard has-[textarea:disabled]:border-border has-[textarea:disabled]:bg-surface has-[textarea:focus-visible]:border-primary has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-focus-ring">
        <div className="flex min-h-11 min-w-0 grow basis-40 flex-col justify-center">
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
              isDisabled
                ? (disabledPlaceholder ?? t('placeholder'))
                : t('placeholder')
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
            variant="ghost"
            size="icon"
            aria-label={t('mic')}
            onClick={onMic}
            className="ml-auto rounded-full text-text-secondary hover:text-primary-text"
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
          className={cn(
            'rounded-full lg:w-auto lg:gap-1.5 lg:pr-5 lg:pl-4',
            !(onMic && !isDisabled) && 'ml-auto',
          )}
        >
          <ArrowUp aria-hidden="true" />
          <span aria-hidden="true" className="hidden lg:inline">
            {t('send')}
          </span>
        </Button>
      </div>
    </form>
  );
}
