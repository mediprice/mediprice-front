'use client';

import { PenLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import type { CurrentUser } from '@/features/auth/queries';

import { NicknameDialog } from './nickname-dialog';

export function AccountInfoCard({
  user,
  footer,
}: {
  user: CurrentUser;
  /** 카드 아래 행동(로그아웃). */
  footer?: ReactNode;
}) {
  const t = useTranslations('mypage.account');
  const [isEditing, setIsEditing] = useState(false);
  /** 다이얼로그를 Trigger 없이 열어 Radix가 포커스를 돌려주지 못하므로 직접 돌려준다. */
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <section
      aria-labelledby="account-info-title"
      className="flex flex-col gap-3"
    >
      <SectionHeader id="account-info-title" title={t('infoTitle')} />
      <dl className="divide-y divide-hairline rounded-xl bg-bg px-4 py-2 shadow-card lg:px-5">
        <div className="flex min-h-13 items-center justify-between gap-4 py-2">
          <dt className="shrink-0 text-body-sm text-text-secondary">
            {t('email')}
          </dt>
          <dd className="min-w-0 text-right text-body break-all">
            {user.email}
          </dd>
        </div>
        <div className="flex min-h-13 items-center justify-between gap-4 py-2">
          <dt className="shrink-0 text-body-sm text-text-secondary">
            {t('nickname')}
          </dt>
          <dd className="flex min-w-0 items-center gap-1">
            <span
              className={
                user.name
                  ? 'text-right text-body break-all'
                  : 'text-body text-text-tertiary'
              }
            >
              {user.name ?? t('nicknameEmpty')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('editNickname')}
              ref={triggerRef}
              onClick={() => setIsEditing(true)}
              className="-mr-2"
            >
              <PenLine aria-hidden="true" />
            </Button>
          </dd>
        </div>
      </dl>
      {footer}
      <NicknameDialog
        open={isEditing}
        onOpenChange={(next) => {
          setIsEditing(next);
          if (!next) requestAnimationFrame(() => triggerRef.current?.focus());
        }}
        currentName={user.name ?? ''}
      />
    </section>
  );
}
