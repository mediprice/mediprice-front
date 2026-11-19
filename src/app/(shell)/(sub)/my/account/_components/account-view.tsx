'use client';

import { useMutation } from '@tanstack/react-query';
import { ChevronRight, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LoginRequired } from '@/features/auth/components/login-required';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { MyPageTitle } from '@/features/auth/components/my-page-title';
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { signOut } from '@/features/auth/session';
import { errorMessageKey } from '@/lib/api/error-message';

import { AccountInfoCard } from './account-info-card';
import { MyDataSection } from './my-data-section';
import { WithdrawSection } from './withdraw-section';

export function AccountView() {
  const t = useTranslations('mypage.account');
  const tNav = useTranslations('nav');
  return (
    <>
      <MyPageHeader>
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <MyPageTitle title={t('heading')} description={t('description')} />
      </MyPageHeader>
      <PageContainer className="pb-section md:max-w-2xl lg:grid lg:max-w-page lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-10">
        <MySideNav />
        <div className="min-w-0 lg:max-w-3xl">
          <LoginRequired>
            {(user) => (
              <div className="flex flex-col gap-10">
                <AccountInfoCard user={user} />
                <LogoutRow />
                <MyDataSection />
                <WithdrawSection />
              </div>
            )}
          </LoginRequired>
        </div>
      </PageContainer>
    </>
  );
}

function LogoutRow() {
  const t = useTranslations('mypage.account');
  const tCommon = useTranslations('common.actions');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const logout = useMutation({
    mutationFn: () => {
      router.replace('/');
      return signOut();
    },
  });
  return (
    <section aria-labelledby="account-session-title" className="flex flex-col">
      <h2 id="account-session-title" className="pb-2 text-section">
        {t('sessionTitle')}
      </h2>
      <div className="flex flex-col border-y border-hairline">
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          className="group -mx-3 flex min-h-16 items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors duration-200 ease-standard hover:bg-surface active:bg-surface-strong"
        >
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary max-[22rem]:hidden [&_svg]:size-5.5"
          >
            <LogOut strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1 text-subheading break-keep">
            {t('logout')}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-5 shrink-0 text-text-tertiary"
            strokeWidth={1.75}
          />
        </button>
      </div>
      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title={t('logoutDialog.title')}
        description={t('logoutDialog.description')}
        cancelLabel={tCommon('cancel')}
        confirmLabel={t('logoutDialog.confirm')}
        confirmVariant="primary"
        onConfirm={() => logout.mutate()}
        isPending={logout.isPending}
        error={logout.isError ? tErrors(errorMessageKey(logout.error)) : null}
      />
    </section>
  );
}
