import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { openLoginDialog } from '@/features/auth/login-dialog-store';

import { AssistantBubble } from './assistant-bubble';

const EXAMPLES = ['manualTherapy', 'shoulder', 'implant', 'shingles'] as const;

/** 시작 화면. 예시를 누르면 그 문장을 바로 보낸다. 로그인 안내 줄은 세션 확인 전에도 자리를 잡아 화면이 밀리지 않게 한다. */
export function ChatIntro({
  onPick,
  isAnonymous,
}: {
  /** 대화가 시작되면 예시를 숨기려고 넘기지 않는다. */
  onPick?: (text: string) => void;
  isAnonymous: boolean;
}) {
  const t = useTranslations('ai');
  return (
    <AssistantBubble text={t('intro.greeting')}>
      {onPick && (
        <>
          <ul
            aria-label={t('intro.examplesLabel')}
            className="flex flex-col gap-2 lg:flex-row lg:flex-wrap"
          >
            {EXAMPLES.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onPick(t(`intro.examples.${id}`))}
                  className="flex min-h-12 w-full items-center gap-2 rounded-3xl border border-border bg-bg px-4.5 py-3 text-left text-label transition-colors duration-150 ease-standard hover:bg-surface active:bg-surface-strong lg:min-h-11 lg:w-auto lg:border-0 lg:bg-primary-tint lg:py-2.5 lg:text-primary-text lg:hover:bg-primary-tint-hover lg:active:bg-primary-tint-pressed"
                >
                  <span className="flex-1">{t(`intro.examples.${id}`)}</span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-text-tertiary lg:hidden"
                    strokeWidth={1.75}
                  />
                </button>
              </li>
            ))}
          </ul>
          <p className="min-h-5 text-caption text-text-tertiary">
            {isAnonymous &&
              t.rich('usage.anonymousHint', {
                login: (chunks) => (
                  <button
                    type="button"
                    onClick={() => openLoginDialog({ reason: 'ai' })}
                    className="touch-target text-caption-bold text-primary-text underline underline-offset-2"
                  >
                    {chunks}
                  </button>
                ),
              })}
          </p>
        </>
      )}
    </AssistantBubble>
  );
}
