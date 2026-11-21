'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { errorMessageKey } from '@/lib/api/error-message';
import { ApiError } from '@/lib/api/errors';

import { consentApi } from '../consent-api';
import { consentKeys, consentQueries, sessionKeys } from '../queries';
import {
  checkAllConsents,
  type ConsentChecks,
  firstUncheckedConsent,
  hasNewerDocuments,
  isReconsent,
  MINIMUM_AGE,
  REQUIRED_CONSENTS,
  requiredConsentDecisions,
} from '../required-consent';
import { ConsentCheck, DocumentLink } from './consent-check';
import { ConsentSummary } from './consent-summary';

type Notice = 'missing' | 'outdated' | 'reload' | null;

/** 필수 동의(이용약관·개인정보 수집·이용·최소 나이). 저장하면 내 정보를 다시 받아 동의 화면을 벗어난다. 409면 문서 버전을 다시 확인한다. */
export function RequiredConsentForm({ onDecline }: { onDecline: () => void }) {
  const t = useTranslations('auth.consent');
  const tErrors = useTranslations('errors');
  const id = useId();
  const queryClient = useQueryClient();
  const status = useQuery(consentQueries.status());
  const [checks, setChecks] = useState<ConsentChecks>(checkAllConsents(false));
  const [notice, setNotice] = useState<Notice>(null);
  const isAll = REQUIRED_CONSENTS.every((type) => checks[type]);
  const save = useMutation({
    mutationFn: () => consentApi.save(requiredConsentDecisions()),
    onSuccess: async (saved) => {
      queryClient.setQueryData(consentKeys.status(), saved);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
    },
    onError: async (error) => {
      if (!(error instanceof ApiError)) return;
      if (error.code !== 'CONSENT_VERSION_OUTDATED') return;
      const fresh = await status.refetch();
      setChecks(checkAllConsents(false));
      setNotice(
        fresh.data && hasNewerDocuments(fresh.data) ? 'reload' : 'outdated',
      );
    },
  });

  // 안내가 그려진 뒤에 포커스를 옮긴다(그리기 전에는 빈 칸이 숨어 있어 포커스가 가지 않는다).
  useEffect(() => {
    if (notice) document.getElementById(`${id}-notice`)?.focus();
  }, [notice, id]);
  const isVersionError =
    save.error instanceof ApiError &&
    save.error.code === 'CONSENT_VERSION_OUTDATED';

  function update(next: ConsentChecks) {
    setChecks(next);
    if (notice === 'missing' && !firstUncheckedConsent(next)) setNotice(null);
  }

  function handleSubmit() {
    const missing = firstUncheckedConsent(checks);
    if (missing) {
      setNotice('missing');
      document.getElementById(`${id}-${missing}`)?.focus();
      return;
    }
    setNotice(null);
    save.mutate();
  }

  return (
    <form
      noValidate
      aria-labelledby="consent-title"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h1 id="consent-title" className="text-title">
          {isReconsent(status.data) ? t('reconsentTitle') : t('title')}
        </h1>
        <p className="text-body text-text-secondary">
          {isReconsent(status.data)
            ? t('reconsentDescription')
            : t('description')}
        </p>
      </div>
      <div className="rounded-xl bg-primary-tint p-4 max-[22rem]:p-3 lg:p-6">
        <ConsentCheck
          id={`${id}-all`}
          label={t('all')}
          hint={t('allHint')}
          isLarge
          checked={isAll}
          onChange={(event) => update(checkAllConsents(event.target.checked))}
        />
      </div>
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {REQUIRED_CONSENTS.map((type) => (
          <li key={type} className="py-4">
            <ConsentCheck
              id={`${id}-${type}`}
              label={t(`items.${type}`, { age: MINIMUM_AGE })}
              hint={
                type === 'AGE_14'
                  ? t('ageHint', { age: MINIMUM_AGE })
                  : undefined
              }
              isRequired
              aria-invalid={notice === 'missing' && !checks[type]}
              checked={checks[type]}
              onChange={(event) =>
                update({ ...checks, [type]: event.target.checked })
              }
            >
              {type === 'TERMS' && (
                <DocumentLink href="/terms">{t('view.TERMS')}</DocumentLink>
              )}
              {type === 'PRIVACY' && (
                <>
                  <ConsentSummary id={`${id}-summary`} />
                  <DocumentLink href="/privacy">
                    {t('view.PRIVACY')}
                  </DocumentLink>
                </>
              )}
            </ConsentCheck>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3">
        <div
          id={`${id}-notice`}
          tabIndex={-1}
          role="alert"
          className="flex flex-col items-start gap-2 outline-none empty:hidden"
        >
          {notice && (
            <p
              className={
                notice === 'missing'
                  ? 'text-body text-danger'
                  : 'text-body text-warning'
              }
            >
              {t(notice)}
            </p>
          )}
          {notice === 'reload' && (
            <Button
              variant="tint"
              size="md"
              onClick={() => window.location.reload()}
            >
              {t('reloadAction')}
            </Button>
          )}
          {save.isError && !isVersionError && (
            <p className="text-body text-danger">
              {tErrors(errorMessageKey(save.error))}
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          elevated
          isLoading={save.isPending}
          className="w-full"
        >
          {t('submit')}
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={onDecline}
          className="w-full"
        >
          {t('decline')}
        </Button>
      </div>
    </form>
  );
}
