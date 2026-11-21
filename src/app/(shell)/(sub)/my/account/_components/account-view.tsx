'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { LoginRequired } from '@/features/auth/components/login-required';
import { MySubPageHeader } from '@/features/auth/components/my-page-header';
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { signOut } from '@/features/auth/session';
import { showToast } from '@/features/feedback/toast-store';

import { AccountInfoCard } from './account-info-card';
import { MyDataSection } from './my-data-section';
import { WithdrawSection } from './withdraw-section';

export function AccountView() {
  const t = useTranslations('mypage.account');
  const router = useRouter();
  const logout = useMutation({
    mutationFn: () => {
      router.replace('/');
      showToast(t('loggedOut'));
      return signOut();
    },
  });

  return (
    <>
      <MySubPageHeader title={t('title')} description={t('description')} />
      <PageContainer className="pt-4 pb-section md:max-w-2xl lg:grid lg:max-w-page lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8 lg:pt-0">
        <MySideNav />
        <LoginRequired reason="account">
          {(user) => (
            <div className="flex max-w-2xl flex-col gap-8">
              <AccountInfoCard
                user={user}
                footer={
                  <Button
                    variant="neutral"
                    size="md"
                    isLoading={logout.isPending}
                    onClick={() => logout.mutate()}
                    className="w-full md:w-fit"
                  >
                    {t('logout')}
                  </Button>
                }
              />
              <MyDataSection />
              <WithdrawSection />
            </div>
          )}
        </LoginRequired>
      </PageContainer>
    </>
  );
}
