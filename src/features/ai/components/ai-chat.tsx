'use client';

import { useTranslations } from 'next-intl';
import {
  type FocusEvent,
  type MouseEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { useSession } from '@/features/auth/use-session';
import { cn } from '@/lib/utils';

import {
  canRetry,
  canSend,
  dailyRemaining,
  type DailyScope,
  isNearEnd,
  isOverDailyLimit,
  SESSION_TURN_LIMIT,
} from '../conversation';
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
import { DailyLimitNotice } from './daily-limit-notice';
import { Disclaimer } from './disclaimer';
import { EmergencyBanner } from './emergency-banner';
import { QuotaDialog } from './quota-dialog';
import { TurnFailure } from './turn-failure';
import { TypingIndicator } from './typing-indicator';
import { UserBubble } from './user-bubble';
import { VoicePanel } from './voice-panel';

const MOBILE_QUERY = '(width < 64rem)';
/** 화면이 낮거나 글자를 크게 키워 대화 칸이 남지 않을 때. 이때는 화면 높이에 맞추지 않고 창 전체가 스크롤된다. */
const SHORT_QUERY = '(max-height: 36rem)';

/** 대화 영역은 상단 바 바로 아래에서 화면 높이를 채우므로 모바일에서는 창 스크롤 0이 제자리다. */
function resetMobileScroll() {
  requestAnimationFrame(() => {
    if (document.activeElement?.tagName === 'TEXTAREA') return;
    if (window.matchMedia(SHORT_QUERY).matches) return;
    if (window.matchMedia(MOBILE_QUERY).matches && window.scrollY > 0) {
      window.scrollTo({ top: 0 });
    }
  });
}

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
  const scope: DailyScope = isMember ? 'member' : 'anonymous';
  const voice = useVoiceInput();
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [dismissedQuota, setDismissedQuota] = useState<string | null>(null);

  const isOverDaily = isOverDailyLimit(conversation, scope);
  const isOpen = canSend(conversation) && !isOverDaily;
  const isLocked = status === 'stopped' || status === 'ended' || isOverDaily;
  const lastMessage = messages.at(-1);

  useEffect(() => {
    void restoreConversation();
  }, []);

  /** 새 답의 첫 줄이 보이게 맞추고, 결과 카드가 뒤늦게 채워져 높이가 바뀌는 동안(1.5초)은 같은 기준으로 다시 맞춘다. */
  useLayoutEffect(() => {
    const log = logRef.current;
    const content = log?.firstElementChild;
    if (!log || !content) return;
    const hasMessages = messages.length > 0;
    function pin(log: HTMLElement) {
      const items = log.querySelectorAll<HTMLElement>('[data-chat-item]');
      const last = items[items.length - 1];
      if (window.matchMedia(SHORT_QUERY).matches) {
        if (hasMessages) last?.scrollIntoView({ block: 'start' });
        return;
      }
      const bottom = log.scrollHeight - log.clientHeight;
      const target = last ? Math.min(last.offsetTop - 12, bottom) : bottom;
      log.scrollTo({ top: Math.max(target, 0) });
    }
    pin(log);
    const until = Date.now() + 1500;
    const observer = new ResizeObserver(() => {
      if (Date.now() < until) pin(log);
      else observer.disconnect();
    });
    observer.observe(content);
    const stop = () => observer.disconnect();
    log.addEventListener('wheel', stop, { once: true });
    log.addEventListener('touchmove', stop, { once: true });
    return () => {
      stop();
      log.removeEventListener('wheel', stop);
      log.removeEventListener('touchmove', stop);
    };
  }, [messages.length, status, isRestored, isOverDaily]);

  /** 입력창이 사라지거나 막히면 포커스가 body로 빠지지 않게 대화 기록으로 옮긴다. */
  useEffect(() => {
    if (!isLocked) return;
    const active = document.activeElement;
    if (!active || active === document.body || active === textareaRef.current) {
      logRef.current?.focus({ preventScroll: true });
    }
    resetMobileScroll();
  }, [isLocked]);

  function handleSend(text: string) {
    return send(text, scope);
  }

  function handlePick(text: string) {
    if (send(text, scope)) logRef.current?.focus({ preventScroll: true });
  }

  function handleRestart() {
    voice.cancel();
    restart();
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  /** 입력을 마치면 탭바가 돌아오고 대화 영역이 다시 화면 높이에 맞으므로, 입력창을 보이려고 내려간 창 스크롤을 되돌린다. */
  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (event.target.tagName === 'TEXTAREA') resetMobileScroll();
  }

  /** 입력 중(모바일 탭바 숨김)에 버튼을 누르면 blur로 탭바가 돌아와 화면이 밀리고 클릭이 빗나가므로, 누르는 순간에는 포커스를 옮기지 않는다. */
  function keepTypingFocus(event: MouseEvent<HTMLElement>) {
    if (document.activeElement?.tagName !== 'TEXTAREA') return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('button, a')) event.preventDefault();
  }

  function focusComposer() {
    textareaRef.current?.focus();
  }

  return (
    <PageContainer className="max-lg:px-0 lg:py-10">
      <div className="flex lg:items-start lg:gap-8">
        <section
          aria-labelledby="ai-chat-title"
          onMouseDown={keepTypingFocus}
          onBlur={handleBlur}
          className={cn(
            'flex min-w-0 flex-1 flex-col bg-bg md:mx-auto md:max-w-2xl lg:mx-0 lg:max-w-none',
            /** 모바일은 상단 바와 하단 탭바 사이를 채운다. 입력 중에는 탭바가 숨으므로(globals.css) 그 높이까지 쓴다. 키보드가 열리면 dvh가 줄어든다. */
            'h-[calc(100dvh-var(--spacing-top-bar)-var(--spacing-tab-bar)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]',
            'max-lg:has-[textarea:focus]:h-[calc(100dvh-var(--spacing-top-bar)-env(safe-area-inset-top,0px))]',
            'lg:h-[calc(100dvh-var(--spacing-top-nav)-5rem)] lg:max-h-240 lg:min-h-150 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-border',
            '[@media(max-height:36rem)]:h-auto! [@media(max-height:36rem)]:min-h-0 [@media(max-height:36rem)]:overflow-visible',
          )}
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
            dailyRemaining={dailyRemaining(conversation, scope)}
            onRestart={messages.length > 0 ? handleRestart : undefined}
          />
          <Disclaimer className="mx-8 max-lg:hidden" />
          {hasEmergency && (
            <div className="pt-3 px-page lg:px-8">
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
            <div
              className={cn(
                '@container flex min-h-full flex-col justify-end gap-5 py-5 px-page lg:px-8 lg:py-6',
                messages.length === 0 && 'lg:justify-center',
              )}
            >
              <Disclaimer className="mb-auto lg:hidden" />
              {messages.length === 0 && (
                <div data-chat-item>
                  <ChatIntro
                    onPick={handlePick}
                    isAnonymous={sessionStatus === 'anonymous'}
                  />
                </div>
              )}
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
              {status === 'failed' && failure && !isOverDaily && (
                <div data-chat-item>
                  <TurnFailure
                    failure={failure === 'quota' ? 'resumeAfterLogin' : failure}
                    onRetry={
                      canRetry(conversation) ? () => retry(scope) : undefined
                    }
                  />
                </div>
              )}
              {isNearEnd(conversation) && !isOverDaily && (
                <p className="text-center text-body-sm text-text-secondary">
                  {t('turns.nearEnd', { count: SESSION_TURN_LIMIT })}
                </p>
              )}
              {isOverDaily ? (
                <div data-chat-item>
                  <DailyLimitNotice isMember={isMember} />
                </div>
              ) : (
                status === 'ended' && (
                  <div data-chat-item>
                    <ChatEnded onRestart={handleRestart} />
                  </div>
                )
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
                if (send(text, scope)) {
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
              isDisabled={status === 'ended' || isOverDaily}
              disabledPlaceholder={
                isOverDaily
                  ? isMember
                    ? t('limit.placeholderMember')
                    : t('limit.placeholderAnonymous')
                  : t('ended.placeholder')
              }
              onSend={handleSend}
              onMic={voice.engine ? voice.start : undefined}
            />
          )}
        </section>
        <AiSideRail
          sessionStatus={sessionStatus}
          dailyRemaining={dailyRemaining(conversation, scope)}
        />
      </div>
      <QuotaDialog
        open={
          isOverDaily && failure === 'quota' && dismissedQuota !== requestId
        }
        onOpenChange={(open) => {
          if (!open) setDismissedQuota(requestId);
        }}
        isMember={isMember}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          logRef.current?.focus({ preventScroll: true });
        }}
      />
    </PageContainer>
  );
}
