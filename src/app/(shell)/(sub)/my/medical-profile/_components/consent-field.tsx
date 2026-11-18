import { ExternalLink } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { LEGAL_FACTS } from '@/config/legal';
import { PendingFact } from '@/features/legal/components/pending-fact';
import { medicalProfileErrorKey } from '@/features/medical-profile/schemas';
import { cn } from '@/lib/utils';

const NOTICES = ['purpose', 'items', 'period', 'refuse'] as const;

/** 건강 정보(민감정보)는 다른 동의와 따로, 법이 정한 네 가지(목적·항목·기간·거부 권리와 불이익)를 알리고 받는다. */
export function ConsentField({
  id,
  error,
  consentedAt,
  ...props
}: Omit<ComponentProps<'input'>, 'id' | 'type'> & {
  id: string;
  error?: string;
  /** 지금 유효한 동의의 시각. 없으면 날짜를 보이지 않는다. */
  consentedAt?: string | null;
}) {
  const t = useTranslations('library.medicalProfile');
  const format = useFormatter();
  const isSent = LEGAL_FACTS.ai.medicalProfileSentToProvider;
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        'flex flex-col gap-4 rounded-2xl bg-surface p-5 lg:p-6',
        error && 'outline-2 outline-danger',
      )}
    >
      <div className="flex flex-col gap-1">
        <h2
          id={`${id}-title`}
          className="flex flex-wrap items-center gap-2 text-heading"
        >
          {t('consent.title')}
          <span className="rounded-md bg-bg px-1.5 py-0.5 text-caption-bold text-text-secondary">
            {t('consent.optional')}
          </span>
        </h2>
        <p className="text-body text-text-secondary">
          {t('consent.description')}
        </p>
      </div>
      <dl
        id={`${id}-notice`}
        className="flex flex-col divide-y divide-border rounded-xl bg-bg px-4"
      >
        {NOTICES.map((notice) => (
          <div key={notice} className="flex flex-col gap-0.5 py-3">
            <dt className="text-label-bold text-text-secondary">
              {t(`consent.${notice}Label`)}
            </dt>
            <dd className="text-body text-text-primary">
              {t(`consent.${notice}`)}
              {notice === 'purpose' && (
                <>
                  {' '}
                  {isSent === null ? (
                    <PendingFact item={t('consent.aiPending')} />
                  ) : (
                    t('consent.ai', { sent: isSent ? 'yes' : 'no' })
                  )}
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <a
        href="/privacy#sensitive"
        target="_blank"
        rel="noopener"
        className="inline-flex min-h-11 w-fit items-center gap-1 text-body-sm text-primary-text underline underline-offset-4 hover:decoration-2"
      >
        {t('consent.policyLink')}
        <ExternalLink
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={1.75}
        />
        <span className="sr-only">{t('consent.newTab')}</span>
      </a>
      <label
        htmlFor={id}
        className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-bg px-4 py-3 text-body has-checked:border-primary has-checked:bg-primary-tint"
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-notice${error ? ` ${id}-error` : ''}`}
          className="size-6 shrink-0 accent-primary"
          {...props}
        />
        {t('consent.label')}
      </label>
      {consentedAt && (
        <p className="text-body-sm text-text-secondary">
          {t('consent.agreedAt', {
            date: format.dateTime(new Date(consentedAt), 'date'),
          })}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-body text-danger">
          {t(`errors.${medicalProfileErrorKey(error)}`)}
        </p>
      )}
    </section>
  );
}
