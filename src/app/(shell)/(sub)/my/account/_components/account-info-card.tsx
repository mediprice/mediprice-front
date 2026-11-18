'use client';

import { PenLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { CurrentUser } from '@/features/auth/queries';

import { NicknameDialog } from './nickname-dialog';

export function AccountInfoCard({ user }: { user: CurrentUser }) {
  const t = useTranslations('mypage.account');
  const [isEditing, setIsEditing] = useState(false);
  return (
    <section
      aria-labelledby="account-info-title"
      className="rounded-xl bg-bg px-4 py-4 shadow-card lg:px-5"
    >
      <h2 id="account-info-title" className="text-subheading">
        {t('infoTitle')}
      </h2>
      <dl className="mt-2 divide-y divide-hairline">
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
              onClick={() => setIsEditing(true)}
              className="-mr-2"
            >
              <PenLine aria-hidden="true" />
            </Button>
          </dd>
        </div>
      </dl>
      <NicknameDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        currentName={user.name ?? ''}
      />
    </section>
  );
}
