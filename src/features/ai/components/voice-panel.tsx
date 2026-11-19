'use client';

import { Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { MAX_INPUT_LENGTH } from '../schemas';
import { MAX_RECORDING_SECONDS, type VoiceState } from '../voice-state';

const WAVE_HEIGHTS = [
  'h-3',
  'h-5',
  'h-7',
  'h-4',
  'h-8',
  'h-6',
  'h-9',
  'h-5',
  'h-7',
  'h-4',
  'h-6',
  'h-8',
  'h-5',
  'h-9',
  'h-6',
  'h-4',
  'h-7',
  'h-5',
  'h-8',
  'h-6',
  'h-4',
  'h-7',
  'h-5',
  'h-3',
];
const WAVE_DELAYS = [
  '[animation-delay:0ms]',
  '[animation-delay:150ms]',
  '[animation-delay:300ms]',
  '[animation-delay:450ms]',
];

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

type VoicePanelProps = {
  state: Exclude<VoiceState, { phase: 'off' }>;
  elapsed: number;
  onFinish: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onRerecord: () => void;
  onSend: (text: string) => void;
  onTypeInstead: () => void;
};

/** 입력창 자리에 열리는 음성 입력. 글로 바꾼 내용은 확인 단계에서 고친 뒤에만 보낸다. */
export function VoicePanel(props: VoicePanelProps) {
  const { state, onCancel } = props;
  const t = useTranslations('ai.voice');
  const tActions = useTranslations('common.actions');
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const title =
    state.phase === 'error'
      ? t(`error.${state.error}.title`)
      : t(`${state.phase}.title`);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [state.phase]);

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-t-3xl bg-bg pt-2 px-page pb-4 shadow-sheet lg:mx-8 lg:mb-7 lg:rounded-xl lg:p-5 lg:px-5 lg:shadow-none"
    >
      <span
        aria-hidden="true"
        className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border-strong/50 lg:hidden"
      />
      <div className="flex items-start justify-between gap-2">
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          aria-live="polite"
          className="pt-2.5 text-subheading outline-none"
        >
          {title}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label={tActions('close')}
          onClick={onCancel}
          className="-mr-2 text-text-secondary"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      <PanelBody {...props} />
      <p className="text-caption text-text-tertiary">{t('note')}</p>
    </section>
  );
}

function PanelBody({
  state,
  elapsed,
  onFinish,
  onCancel,
  onRetry,
  onRerecord,
  onSend,
  onTypeInstead,
}: VoicePanelProps) {
  const t = useTranslations('ai.voice');
  const tActions = useTranslations('common.actions');
  const cancel = (
    <Button variant="neutral" size="md" onClick={onCancel}>
      {tActions('cancel')}
    </Button>
  );

  switch (state.phase) {
    case 'ready':
    case 'recording':
      return (
        <>
          <div className="flex flex-col gap-3">
            <Wave isActive={state.phase === 'recording'} />
            {state.phase === 'recording' && state.interim && (
              <p className="text-body text-text-primary">{state.interim}</p>
            )}
            <p className="flex justify-between gap-2 text-body-sm text-text-secondary">
              <span>{t(`${state.phase}.status`)}</span>
              <span
                className="tabular-nums"
                aria-label={t('timerLabel', {
                  seconds: elapsed,
                  limit: MAX_RECORDING_SECONDS,
                })}
              >
                {t('timer', {
                  elapsed: formatClock(elapsed),
                  limit: formatClock(MAX_RECORDING_SECONDS),
                })}
              </span>
            </p>
          </div>
          <Actions>
            {cancel}
            {state.phase === 'recording' && (
              <Button size="md" onClick={onFinish}>
                {t('recording.done')}
              </Button>
            )}
          </Actions>
        </>
      );
    case 'transcribing':
      return (
        <>
          <div
            role="status"
            className="flex flex-col gap-2.5 rounded-lg border border-border-strong p-4"
          >
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
            <p className="text-body-sm text-text-secondary">
              {t('transcribing.status')}
            </p>
          </div>
          <Actions>{cancel}</Actions>
        </>
      );
    case 'confirm':
      return (
        <ConfirmBody
          key={state.text}
          text={state.text}
          onRerecord={onRerecord}
          onSend={onSend}
        />
      );
    case 'error':
      return (
        <>
          <p className="text-body text-text-secondary">
            {t(`error.${state.error}.body`)}
          </p>
          <Actions>
            <Button variant="tint" size="md" onClick={onTypeInstead}>
              {t('typeInstead')}
            </Button>
            <Button size="md" onClick={onRetry}>
              {t(`error.${state.error}.action`)}
            </Button>
          </Actions>
        </>
      );
  }
}

function ConfirmBody({
  text,
  onRerecord,
  onSend,
}: {
  text: string;
  onRerecord: () => void;
  onSend: (text: string) => void;
}) {
  const t = useTranslations('ai.voice.confirm');
  const fieldId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState(text);
  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg border border-border-strong p-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring">
        <label htmlFor={fieldId} className="sr-only">
          {t('label')}
        </label>
        <textarea
          id={fieldId}
          value={draft}
          maxLength={MAX_INPUT_LENGTH}
          aria-describedby={hintId}
          onChange={(event) => setDraft(event.target.value)}
          className="field-sizing-content max-h-40 min-h-12 w-full resize-none bg-transparent text-field text-text-primary focus-visible:outline-none"
        />
        <p
          id={hintId}
          className="flex items-center gap-1.5 text-caption text-text-tertiary"
        >
          <Pencil aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          {t('hint')}
        </p>
      </div>
      <Actions>
        <Button variant="tint" size="md" onClick={onRerecord}>
          {t('rerecord')}
        </Button>
        <Button
          size="md"
          disabled={draft.trim().length === 0}
          onClick={() => onSend(draft)}
        >
          {t('send')}
        </Button>
      </Actions>
    </>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-2 lg:flex lg:justify-end">
      {children}
    </div>
  );
}

function Wave({ isActive }: { isActive: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 items-center justify-center gap-1"
    >
      {WAVE_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className={cn(
            'w-0.75 rounded-full transition-[height] duration-200 ease-standard',
            isActive
              ? cn(
                  'animate-pulse bg-primary',
                  height,
                  WAVE_DELAYS[index % WAVE_DELAYS.length],
                )
              : 'h-0.75 bg-border-strong',
          )}
        />
      ))}
    </div>
  );
}
