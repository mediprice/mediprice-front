'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type ReactNode, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { LEGAL_FACTS } from '@/config/legal';
import { ConsentCheck } from '@/features/auth/components/consent-check';
import { PendingFact } from '@/features/legal/components/pending-fact';
import { savePendingLocation } from '@/features/map/pending-location';
import { cn } from '@/lib/utils';

/**
 * 현재 위치를 처음 쓸 때 받는 위치정보 이용 동의. 법이 정한 고지(목적·항목·보유 기간·거부할 권리)와 약관 링크를 보이고,
 * 체크해야 동의 버튼이 켜진다. 약관은 같은 탭으로 열고, 돌아오면 지도가 이 창을 다시 연다(로그인 뒤 이어 하기와 같은 방식).
 */
export function LocationConsentDialog({
  open,
  onOpenChange,
  onAgree,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
  isSaving: boolean;
}) {
  const t = useTranslations('map.locationConsent');
  const tActions = useTranslations('common.actions');
  const id = useId();
  const [isChecked, setIsChecked] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  /** Trigger 없이 여닫으므로 닫을 때 포커스를 돌려줄 곳을 직접 기억한다. */
  const openerRef = useRef<HTMLElement | null>(null);
  const days = LEGAL_FACTS.retention.locationUsageDays;

  /** 다시 열면 체크를 지워 매번 직접 동의하게 한다. */
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setIsChecked(false);
  }

  const notices: { key: string; label: string; content: ReactNode }[] = [
    { key: 'purpose', label: t('purposeLabel'), content: t('purpose') },
    {
      key: 'items',
      label: t('itemsLabel'),
      content: (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>{t('itemsPosition')}</li>
          <li>{t('itemsLog')}</li>
        </ul>
      ),
    },
    {
      key: 'period',
      label: t('periodLabel'),
      content: (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>{t('periodPosition')}</li>
          <li>
            {days === null ? (
              <PendingFact item={t('periodLogPending')} />
            ) : (
              t('periodLog', { days })
            )}
          </li>
        </ul>
      ),
    },
    { key: 'refuse', label: t('refuseLabel'), content: t('refuse') },
  ];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!isSaving) onOpenChange(next);
      }}
    >
      <ResponsiveDialogContent
        title={t('title')}
        aria-describedby={`${id}-description`}
        onOpenAutoFocus={() => {
          openerRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          if (!openerRef.current?.isConnected) return;
          event.preventDefault();
          openerRef.current.focus();
        }}
        footer={
          <>
            <Button
              variant="tint"
              size="lg"
              aria-disabled={isSaving || undefined}
              onClick={() => onOpenChange(false)}
              className={cn(
                'flex-[1_1_8rem]',
                isSaving && 'pointer-events-none',
              )}
            >
              {tActions('cancel')}
            </Button>
            <Button
              size="lg"
              disabled={!isChecked}
              isLoading={isSaving}
              onClick={onAgree}
              className="flex-[1_1_8rem]"
            >
              {t('confirm')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p id={`${id}-description`} className="text-body text-text-primary">
            {t('description')}
          </p>
          <dl className="flex flex-col divide-y divide-hairline rounded-xl bg-surface px-4 max-[22rem]:px-3">
            {notices.map((notice) => (
              <div key={notice.key} className="flex flex-col gap-1 py-3">
                <dt className="text-caption-strong text-text-secondary">
                  {notice.label}
                </dt>
                <dd className="text-body-sm break-keep text-text-primary">
                  {notice.content}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            href="/location-terms"
            onClick={() =>
              savePendingLocation(
                window.location.pathname + window.location.search,
              )
            }
            className="inline-flex min-h-11 w-fit items-center gap-1 text-body-sm text-primary-text underline underline-offset-4 hover:decoration-2"
          >
            {t('termsLink')}
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={1.75}
            />
          </Link>
          <div className="rounded-xl bg-primary-tint p-4 max-[22rem]:p-3">
            <ConsentCheck
              id={`${id}-agree`}
              label={t('agree')}
              hint={t('agreeHint')}
              isRequired
              checked={isChecked}
              onChange={(event) => setIsChecked(event.target.checked)}
            />
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
