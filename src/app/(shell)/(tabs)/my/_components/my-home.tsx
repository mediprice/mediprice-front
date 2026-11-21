'use client';

import { useMutation } from '@tanstack/react-query';
import { CircleAlert, LogOut, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleLoginButton } from '@/features/auth/components/google-login-button';
import { MyMenuList } from '@/features/auth/components/my-menu-list';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { UserAvatar } from '@/features/auth/components/user-avatar';
import { signOut } from '@/features/auth/session';
import { displayName, useSession } from '@/features/auth/use-session';
import { showToast } from '@/features/feedback/toast-store';

export function MyHome() {
  const t = useTranslations('mypage.home');
  const tNav = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { status, user, refetch } = useSession();
  /** 로그아웃해도 이 화면에 머물러 로그인 안내로 바뀐다. */
  const logout = useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => showToast(t('loggedOut')),
  });

  if (status === 'pending') {
    return (
      <>
        {/** 로그인 여부를 아직 모르므로 두 모양 모두에 맞는 제목 한 줄과 카드 하나로 자리를 잡는다(대부분은 로그인 안내 카드가 된다). */}
        <MyPageHeader>
          <div role="status">
            <Skeleton className="h-8 w-28 lg:h-8.5" />
            <span className="sr-only">{tCommon('status.loading')}</span>
          </div>
        </MyPageHeader>
        <PageContainer className="pb-section md:max-w-2xl lg:max-w-page">
          <Skeleton className="h-64 w-full rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <MyPageHeader>
          <h1 className="text-title">{tNav('my')}</h1>
        </MyPageHeader>
        <PageContainer className="pb-section md:max-w-2xl lg:max-w-page">
          {status === 'error' ? (
            <EmptyState
              icon={<CircleAlert />}
              title={t('errorTitle')}
              description={tAuth('required.errorDescription')}
              action={
                <Button variant="tint" size="md" onClick={refetch}>
                  {tCommon('actions.retry')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<UserRound />}
              title={t('signedOutTitle')}
              description={t('signedOutDescription')}
              action={<GoogleLoginButton size="md" />}
              className="rounded-xl bg-surface"
            />
          )}
        </PageContainer>
      </>
    );
  }

  const name = displayName(user);
  return (
    <>
      <MyPageHeader>
        <div className="flex items-center gap-4">
          <UserAvatar name={name} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-title break-all">{t('greeting', { name })}</h1>
            <p className="text-body-sm text-text-secondary">{t('provider')}</p>
          </div>
        </div>
      </MyPageHeader>
      {/** 내 정보 홈은 메뉴 카드가 곧 탐색이라 옆 메뉴를 두지 않는다(하위 화면만 옆 메뉴를 쓴다). */}
      <PageContainer className="pb-section md:max-w-2xl lg:max-w-page">
        <MyMenuList />
        <div className="mt-4 border-t border-hairline pt-6 lg:mt-8 lg:border-t-0 lg:pt-0">
          <Button
            variant="neutral"
            size="md"
            isLoading={logout.isPending}
            onClick={() => logout.mutate()}
            className="w-full md:w-fit"
          >
            <LogOut aria-hidden="true" />
            {t('logout')}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
