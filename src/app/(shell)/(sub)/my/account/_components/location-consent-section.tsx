'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SectionHeader } from '@/components/ui/section-header';
import { isLocationConsentActive } from '@/features/auth/consent-status';
import { consentMutations, consentQueries } from '@/features/auth/queries';
import { showToast } from '@/features/feedback/toast-store';
import { errorMessageKey } from '@/lib/api/error-message';

/** 위치정보 이용 동의 상태를 보여 주고, 동의했다면 여기서 철회할 수 있게 한다. */
export function LocationConsentSection() {
  const t = useTranslations('mypage.account.location');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common.actions');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: status } = useQuery(consentQueries.status());
  const withdraw = useMutation(consentMutations.withdrawLocation(queryClient));

  if (!status) return null;

  const active = isLocationConsentActive(status);
  const agreedAt = status.consents.find(
    ({ type }) => type === 'LOCATION',
  )?.agreedAt;

  return (
    <section
      aria-labelledby="account-location-title"
      className="flex flex-col gap-3"
    >
      <SectionHeader id="account-location-title" title={t('title')} />
      <div className="flex flex-col gap-3 rounded-xl bg-bg px-4 py-4 shadow-card lg:px-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-60 items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary max-[22rem]:hidden [&_svg]:size-5"
            >
              <MapPin strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3 className="text-body break-keep">{t('rowTitle')}</h3>
              <p className="text-body-sm text-text-secondary">
                {active
                  ? agreedAt
                    ? t('agreed', {
                        date: format.dateTime(new Date(agreedAt), 'date'),
                      })
                    : t('agreedNoDate')
                  : t('notAgreed')}
              </p>
            </div>
          </div>
          {active && (
            <Button
              variant="neutral"
              size="md"
              onClick={() => setOpen(true)}
              className="w-full md:w-auto"
            >
              {t('withdraw')}
            </Button>
          )}
        </div>
        {!active && (
          <p className="text-body-sm text-text-secondary">
            {t('notAgreedHint')}
          </p>
        )}
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) withdraw.reset();
          setOpen(next);
        }}
        title={t('confirmTitle')}
        description={t('confirmDescription')}
        cancelLabel={tCommon('cancel')}
        confirmLabel={t('confirmAction')}
        onConfirm={() =>
          withdraw.mutate(undefined, {
            onSuccess: () => {
              setOpen(false);
              showToast(t('done'));
            },
          })
        }
        isPending={withdraw.isPending}
        error={
          withdraw.isError ? tErrors(errorMessageKey(withdraw.error)) : null
        }
      />
    </section>
  );
}
