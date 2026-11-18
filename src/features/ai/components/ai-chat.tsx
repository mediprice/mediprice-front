'use client';

import { useTranslations } from 'next-intl';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { useSession } from '@/features/auth/use-session';

import { canRetry, canSend, isNearEnd } from '../conversation';
import {
  restoreConversation,
  restoredState,
  useConversation,
} from '../conversation-store';
import { AI_DAILY_LIMIT } from '../usage-limits';
import { useVoiceInput } from '../use-voice-input';
import { AiSideRail } from './ai-side-rail';
import { AssistantMessage } from './assistant-message';
import { ChatEnded } from './chat-ended';
import { ChatHeader } from './chat-header';
import { ChatIntro } from './chat-intro';
import { Composer } from './composer';
import { EmergencyBanner } from './emergency-banner';
import { QuotaDialog } from './quota-dialog';
import { TurnFailure } from './turn-failure';
import { TypingIndicator } from './typing-indicator';
import { UserBubble } from './user-bubble';
import { VoicePanel } from './voice-panel';

/** S-04 AI 대화와 S-05 후보 결과. 대화는 sessionStorage에 남아 새로 고쳐도 이어진다. */
export function AiChat() {
  const t = useTranslations('ai');
  const conversation = useConversation((state) => state);
  const { messages, status, failure, hasEmergency, requestId } = conversation;
  const { send, retry, restart } = conversation;
  const isRestored = useSyncExternalStore(
    restoredState.subscribe,
    restoredState.get,
    restoredState.getServer,
  );
  const { status: sessionStatus } = useSession();
  const isMember = sessionStatus === 'authenticated';
  const voice = useVoiceInput();
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [dismissedQuota, setDismissedQuota] = useState<string | null>(null);

  const isOpen = canSend(conversation);
  const lastMessage = messages.at(-1);

  useEffect(() => {
    void restoreConversation();
  }, []);

  useLayoutEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const items = log.querySelectorAll<HTMLElement>('[data-chat-item]');
    const last = items[items.length - 1];
    const bottom = log.scrollHeight - log.clientHeight;
    const target = last ? Math.min(last.offsetTop - 12, bottom) : bottom;
    log.scrollTo({ top: Math.max(target, 0) });
  }, [messages.length, status, isRestored]);

  /** 입력창이 사라지거나 막히면 포커스가 body로 빠지지 않게 대화 기록으로 옮긴다. */
  useEffect(() => {
    if (status !== 'stopped' && status !== 'ended') return;
    const active = document.activeElement;
    if (!active || active === document.body || active === textareaRef.current) {
      logRef.current?.focus({ preventScroll: true });
    }
  }, [status]);

  function handleSend(text: string) {
    return send(text);
  }

  function handlePick(text: string) {
    if (send(text)) logRef.current?.focus({ preventScroll: true });
  }

  function handleRestart() {
    voice.cancel();
    restart();
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function focusComposer() {
    textareaRef.current?.focus();
  }

  return (
    <PageContainer className="max-lg:px-0 lg:py-10">
      <div className="flex lg:items-start lg:gap-8">
        <section
          aria-labelledby="ai-chat-title"
          className="flex h-[calc(100dvh-var(--spacing-top-bar)-var(--spacing-tab-bar)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] min-h-110 min-w-0 flex-1 flex-col bg-surface lg:h-[calc(100dvh-var(--spacing-top-nav)-5rem)] lg:max-h-240 lg:min-h-150 lg:overflow-hidden lg:rounded-xl"
        >
          <ChatHeader
            titleId="ai-chat-title"
            dailyLimit={
              sessionStatus === 'pending'
                ? null
                : isMember
                  ? AI_DAILY_LIMIT.member
                  : AI_DAILY_LIMIT.anonymous
            }
            dailyRemaining={conversation.remainingTurns}
            onRestart={messages.length > 0 ? handleRestart : undefined}
          />
          <p className="bg-hero px-4 py-2 text-body-sm text-text-secondary lg:mx-8 lg:mt-4 lg:rounded-lg lg:px-4 lg:py-2.5">
            {t('header.disclaimer')}
          </p>
          {hasEmergency && (
            <div className="px-4 pt-3 lg:px-8">
              <EmergencyBanner />
            </div>
          )}
          <div
            ref={logRef}
            role="log"
            aria-label={t('log.label')}
            tabIndex={-1}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none"
          >
            <div className="flex min-h-full flex-col justify-end gap-4 px-4 py-4 lg:px-8 lg:py-5">
              <div data-chat-item>
                <ChatIntro
                  onPick={
                    isRestored && messages.length === 0 ? handlePick : undefined
                  }
                  isAnonymous={sessionStatus === 'anonymous'}
                />
              </div>
              {messages.map((message) => (
                <div key={message.id} data-chat-item>
                  {message.role === 'user' ? (
                    <UserBubble text={message.text} />
                  ) : (
                    <AssistantMessage
                      message={message}
                      isActive={message === lastMessage && isOpen}
                      onAnswer={handlePick}
                      onAskMore={focusComposer}
                      onRestart={handleRestart}
                    />
                  )}
                </div>
              ))}
              {status === 'sending' && (
                <div data-chat-item>
                  <TypingIndicator />
                </div>
              )}
              {status === 'failed' && failure && (
                <div data-chat-item>
                  <TurnFailure
                    failure={failure}
                    onRetry={
                      canRetry(conversation) &&
                      !(failure === 'quota' && isMember)
                        ? retry
                        : undefined
                    }
                  />
                </div>
              )}
              {isNearEnd(conversation) && (
                <p className="text-center text-caption text-text-tertiary">
                  {t('turns.nearEnd')}
                </p>
              )}
              {status === 'ended' && (
                <div data-chat-item>
                  <ChatEnded onRestart={handleRestart} />
                </div>
              )}
            </div>
          </div>
          {status === 'stopped' ? null : voice.state.phase !== 'off' ? (
            <VoicePanel
              state={voice.state}
              elapsed={voice.elapsed}
              onFinish={voice.finish}
              onCancel={() => {
                voice.cancel();
                requestAnimationFrame(focusComposer);
              }}
              onRetry={voice.retry}
              onRerecord={voice.start}
              onSend={(text) => {
                if (send(text)) {
                  voice.cancel();
                  logRef.current?.focus({ preventScroll: true });
                }
              }}
              onTypeInstead={() => {
                voice.cancel();
                requestAnimationFrame(focusComposer);
              }}
            />
          ) : (
            <Composer
              textareaRef={textareaRef}
              isSending={status === 'sending'}
              isDisabled={status === 'ended'}
              onSend={handleSend}
              onMic={voice.engine ? voice.start : undefined}
            />
          )}
        </section>
        <AiSideRail
          sessionStatus={sessionStatus}
          dailyRemaining={conversation.remainingTurns}
        />
      </div>
      <QuotaDialog
        open={failure === 'quota' && dismissedQuota !== requestId}
        onOpenChange={(open) => {
          if (!open) setDismissedQuota(requestId);
        }}
        isMember={isMember}
      />
    </PageContainer>
  );
}
