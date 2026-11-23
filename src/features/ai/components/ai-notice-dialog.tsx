'use client';

import {
  ExternalLink,
  GraduationCap,
  Mic,
  Send,
  ServerOff,
  UserRoundX,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { LEGAL_FACTS } from '@/config/legal';
import { type AiNoticeKind, aiProviders } from '@/features/ai/ai-notice';
import type { VoiceEngine } from '@/features/ai/voice-state';
import { PendingFact } from '@/features/legal/components/pending-fact';

/** 첫 전송(또는 첫 음성 입력) 전에 한 번 보이는 안내. 확인하면 막았던 행동을 이어서 한다. 닫으면 아무것도 보내지 않는다. */
export function AiNoticeDialog({
  kinds,
  engine,
  onConfirm,
  onDismiss,
}: {
  /** 아직 확인하지 않은 안내. 비었으면 닫혀 있다. */
  kinds: AiNoticeKind[];
  engine: VoiceEngine | null;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations('ai.notice');
  const tCommon = useTranslations('common.actions');
  const tCountries = useTranslations('legal.countries');
  const format = useFormatter();
  const opener = useRef<HTMLElement | null>(null);
  const isOpen = kinds.length > 0;
  const hasVoice = kinds.includes('voice');
  const training = LEGAL_FACTS.ai.providerTrainingUse;
  const icon = { 'aria-hidden': true, strokeWidth: 1.75 } as const;

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <ResponsiveDialogContent
        title={hasVoice ? t('voiceTitle') : t('title')}
        description={t('description')}
        className="md:max-w-lg"
        onOpenAutoFocus={() => {
          opener.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          if (!opener.current?.isConnected) return;
          event.preventDefault();
          opener.current.focus();
        }}
        footer={
          <>
            <Button
              variant="neutral"
              size="md"
              onClick={onDismiss}
              className="flex-1"
            >
              {tCommon('cancel')}
            </Button>
            <Button size="md" onClick={onConfirm} className="flex-[2]">
              {hasVoice ? t('confirmVoice') : t('confirm')}
            </Button>
          </>
        }
      >
        <ul className="flex flex-col divide-y divide-hairline">
          {kinds.includes('ai') && (
            <>
              <NoticeItem icon={<Send {...icon} />}>
                <p>{t('sent')}</p>
                <p className="text-body-sm text-text-secondary">
                  {t('providersLabel')}:{' '}
                  {format.list(
                    aiProviders().map((provider, index) => (
                      <span key={provider.company ?? index}>
                        {provider.company && provider.countries ? (
                          t('provider', {
                            company: provider.company,
                            countries: format.list(
                              provider.countries.map((country) =>
                                tCountries(country),
                              ),
                            ),
                          })
                        ) : (
                          <PendingFact />
                        )}
                      </span>
                    )),
                  )}
                </p>
              </NoticeItem>
              <NoticeItem icon={<ServerOff {...icon} />}>
                <p>{t('notStored')}</p>
              </NoticeItem>
              <NoticeItem icon={<UserRoundX {...icon} />}>
                <p className="text-label-bold">{t('noPersonal')}</p>
              </NoticeItem>
              <NoticeItem icon={<GraduationCap {...icon} />}>
                <p>
                  {training === null
                    ? t('trainingPending')
                    : t('training', { use: training ? 'yes' : 'no' })}
                </p>
              </NoticeItem>
            </>
          )}
          {hasVoice && (
            <NoticeItem icon={<Mic {...icon} />}>
              <p>
                {engine === 'recorder' ? t('voiceRecorder') : t('voiceSpeech')}
              </p>
            </NoticeItem>
          )}
        </ul>
        <a
          href="/privacy#ai"
          target="_blank"
          rel="noopener"
          className="mt-2 inline-flex min-h-11 items-center gap-1 text-body-sm text-primary-text underline underline-offset-4 hover:decoration-2"
        >
          {t('policyLink')}
          <ExternalLink
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={1.75}
          />
          <span className="sr-only">{t('newTab')}</span>
        </a>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function NoticeItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3 py-3 text-body text-text-primary">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary [&_svg]:size-4.5"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1.5">
        {children}
      </div>
    </li>
  );
}
