import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { openLoginDialog } from '@/features/auth/login-dialog-store';

import { AiAvatar } from './ai-avatar';

const EXAMPLES = ['manualTherapy', 'shoulder', 'implant', 'shingles'] as const;

/** 시작 화면. 결론 문장 제목과 큰 예시 질문을 두고, 예시를 누르면 그 문장을 바로 보낸다. 로그인 안내 줄은 세션 확인 전에도 자리를 잡는다. */
export function ChatIntro({
  onPick,
  isAnonymous,
}: {
  onPick: (text: string) => void;
  isAnonymous: boolean;
}) {
  const t = useTranslations('ai');
  const examplesId = useId();
  return (
    <div className="flex flex-col gap-5 lg:gap-8">
      <div className="flex flex-col gap-3">
        <AiAvatar className="size-10 text-label-bold" />
        <h2 className="text-display text-balance">{t('intro.title')}</h2>
        <p className="max-w-xl text-body text-text-secondary">
          {t('intro.description')}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <p id={examplesId} className="text-label-bold text-text-secondary">
          {t('intro.examplesLabel')}
        </p>
        <ul
          aria-labelledby={examplesId}
          className="grid gap-2 sm:grid-cols-2 sm:gap-3"
        >
          {EXAMPLES.map((id) => (
            <li key={id} className="flex">
              <button
                type="button"
                onClick={() => onPick(t(`intro.examples.${id}`))}
                className="group flex min-h-14 w-full items-center gap-3 rounded-3xl border border-border-strong bg-bg px-5 py-3.5 text-left text-body text-text-primary transition-[background-color,border-color,scale] duration-200 ease-standard hover:border-primary hover:bg-primary-tint active:scale-98 active:bg-primary-tint-hover motion-reduce:transition-none"
              >
                <span className="flex-1">{t(`intro.examples.${id}`)}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-text-tertiary transition-colors duration-200 ease-standard group-hover:text-primary-text"
                  strokeWidth={1.75}
                />
              </button>
            </li>
          ))}
        </ul>
        <p className="min-h-11 text-body-sm text-text-secondary">
          {isAnonymous &&
            t.rich('usage.anonymousHint', {
              login: (chunks) => (
                <button
                  type="button"
                  onClick={() => openLoginDialog({ reason: 'ai' })}
                  className="inline-flex min-h-11 items-center text-label-bold text-primary-text underline underline-offset-4"
                >
                  {chunks}
                </button>
              ),
            })}
        </p>
      </div>
    </div>
  );
}
