import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { LEGAL_FACTS } from '@/config/legal';
import { PendingFact } from '@/features/legal/components/pending-fact';
import { cn } from '@/lib/utils';

import { claimFormErrorKey } from '../schemas';

const NOTICES = ['purpose', 'items', 'period', 'refuse'] as const;

/** 신청인 이름·이메일 수집·이용 안내(목적·항목·보유 기간·거부 권리)와 필수 동의. 문구를 고치면 CLAIM_PRIVACY_NOTICE_VERSION을 올린다. */
export function ClaimPrivacyNotice({
  id,
  error,
  ...props
}: Omit<ComponentProps<'input'>, 'id' | 'type'> & {
  id: string;
  error?: string;
}) {
  const t = useTranslations('claims.notice');
  const tErrors = useTranslations('claims.errors');
  const tPage = useTranslations('claims.page');
  const days = LEGAL_FACTS.retention.rightsClaimDays;

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        'flex flex-col gap-4 rounded-xl bg-surface p-5 max-[22rem]:p-4 lg:p-6',
        error && 'outline-2 outline-danger',
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-heading">
          {t('title')}
        </h2>
        <p className="text-body text-text-secondary">{t('description')}</p>
      </div>
      <dl
        id={`${id}-notice`}
        className="flex flex-col divide-y divide-border rounded-xl bg-bg px-4"
      >
        {NOTICES.map((notice) => (
          <div key={notice} className="flex flex-col gap-0.5 py-3">
            <dt className="text-label-bold text-text-secondary">
              {t(`${notice}Label`)}
            </dt>
            <dd className="text-body text-text-primary">
              {notice !== 'period' ? (
                t(notice)
              ) : days === null ? (
                <PendingFact item={t('periodPending')} />
              ) : (
                t('period', { days })
              )}
            </dd>
          </div>
        ))}
      </dl>
      <a
        href="/privacy#items"
        target="_blank"
        rel="noopener"
        className="inline-flex min-h-11 w-fit items-center gap-1 text-body-sm text-primary-text underline underline-offset-4 hover:decoration-2"
      >
        {t('privacyLink')}
        <ExternalLink
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={1.75}
        />
        <span className="sr-only">{tPage('newTab')}</span>
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
        {t('agree')}
      </label>
      {error && (
        <p id={`${id}-error`} className="text-body text-danger">
          {tErrors(claimFormErrorKey(error))}
        </p>
      )}
    </section>
  );
}
