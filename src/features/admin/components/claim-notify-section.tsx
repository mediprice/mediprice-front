'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { errorMessageKey } from '@/lib/api/error-message';

import type { AdminClaim } from '../claim-api';
import { adminClaimMutations } from '../claim-queries';

type Target = 'claimant' | 'author';

const FIELDS = {
  claimant: { at: 'claimantNotifiedAt', body: 'claimantNotified' },
  author: { at: 'authorNotifiedAt', body: 'authorNotified' },
} as const;

/** 처리한 신고의 결과 안내 기록. 메일 발송 기능이 없어 운영자가 직접 알린 뒤 한 번만 기록한다(지울 수 없음). */
export function ClaimNotifySection({ claim }: { claim: AdminClaim }) {
  const t = useTranslations('admin.claims.notify');
  const tErrors = useTranslations('errors');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const mutation = useMutation(adminClaimMutations.markNotified(queryClient));
  const [target, setTarget] = useState<Target | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isRecordedRef = useRef(false);

  return (
    <section
      aria-labelledby="claim-notify-title"
      className="flex flex-col gap-2"
    >
      <h3
        ref={titleRef}
        id="claim-notify-title"
        tabIndex={-1}
        className="text-subheading outline-none"
      >
        {t('title')}
      </h3>
      <p className="text-body-sm text-text-secondary">{t('description')}</p>
      <ul className="flex flex-col divide-y divide-hairline">
        {(['claimant', 'author'] as const).map((key) => {
          const at = claim[FIELDS[key].at];
          return (
            <li
              key={key}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-label-bold">{t(key)}</span>
                <span className="text-body-sm text-text-secondary tabular-nums">
                  {at
                    ? t('notifiedAt', {
                        date: format.dateTime(new Date(at), 'dateTime'),
                      })
                    : t('notYet')}
                </span>
              </div>
              {!at && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t('recordFor', { target: t(key) })}
                  onClick={() => {
                    isRecordedRef.current = false;
                    setTarget(key);
                  }}
                >
                  {t('record')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (open) return;
          mutation.reset();
          setTarget(null);
        }}
        title={target ? t('confirmTitle', { target: t(target) }) : t('title')}
        description={t('confirmDescription')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        confirmVariant="primary"
        isPending={mutation.isPending}
        error={mutation.isError && tErrors(errorMessageKey(mutation.error))}
        onConfirm={() => {
          if (!target) return;
          mutation.mutate(
            { claimId: claim.id, [FIELDS[target].body]: true },
            {
              onSuccess: () => {
                isRecordedRef.current = true;
                setTarget(null);
              },
            },
          );
        }}
        onCloseAutoFocus={(event) => {
          if (!isRecordedRef.current) return;
          /** 기록하면 연 버튼이 사라지므로 이 묶음의 제목으로 포커스를 옮긴다. */
          event.preventDefault();
          titleRef.current?.focus();
        }}
      />
    </section>
  );
}
