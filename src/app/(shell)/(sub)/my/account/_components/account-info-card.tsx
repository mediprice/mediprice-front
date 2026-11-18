'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { CurrentUser } from '@/features/auth/queries';
import { cn } from '@/lib/utils';

import { NicknameDialog } from './nickname-dialog';

const rowClass =
  'flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3';

export function AccountInfoCard({ user }: { user: CurrentUser }) {
  const t = useTranslations('mypage.account');
  const [isEditing, setIsEditing] = useState(false);
  /** 다이얼로그를 Trigger 없이 열어 Radix가 포커스를 돌려주지 못하므로 직접 돌려준다. */
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <section aria-labelledby="account-info-title" className="flex flex-col">
      <h2 id="account-info-title" className="pb-2 text-heading">
        {t('infoTitle')}
      </h2>
      <dl className="flex flex-col divide-y divide-hairline border-y border-hairline">
        <div className={rowClass}>
          <dt className="shrink-0 text-body text-text-secondary">
            {t('email')}
          </dt>
          <dd className="min-w-0 text-body-lg break-all">{user.email}</dd>
        </div>
        <div className={rowClass}>
          <dt className="shrink-0 text-body text-text-secondary">
            {t('nickname')}
          </dt>
          <dd className="flex max-w-full grow flex-wrap items-center justify-end gap-x-3 gap-y-2">
            <span
              className={cn(
                'min-w-0 text-body-lg wrap-break-word break-keep',
                !user.name && 'text-text-tertiary',
              )}
            >
              {user.name ?? t('nicknameEmpty')}
            </span>
            <Button
              variant="tint"
              size="sm"
              aria-label={t('editNickname')}
              ref={triggerRef}
              onClick={() => setIsEditing(true)}
            >
              {t('editNicknameShort')}
            </Button>
          </dd>
        </div>
      </dl>
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
