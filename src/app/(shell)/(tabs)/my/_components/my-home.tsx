'use client';

import { UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { MyMenuList } from '@/features/auth/components/my-menu-list';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { UserAvatar } from '@/features/auth/components/user-avatar';
import { displayName, useSession } from '@/features/auth/use-session';
import { cn } from '@/lib/utils';

import { MySignedOut } from './my-signed-out';
import { useMyCounts } from './use-my-counts';

const containerClass = 'pb-section md:max-w-2xl lg:max-w-page';

export function MyHome() {
  const t = useTranslations('mypage.home');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const { status, user, refetch } = useSession();
  const counts = useMyCounts(status === 'authenticated');

  if (status === 'pending') {
    return (
      <>
        <MyPageHeader>
          <div role="status" className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full lg:size-16" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-56" />
            </div>
            <span className="sr-only">{tCommon('status.loading')}</span>
          </div>
        </MyPageHeader>
        <PageContainer className={containerClass}>
          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:gap-12">
            {[3, 2].map((rows) => (
              <div key={rows} className="flex flex-col gap-2">
                <Skeleton className="h-5 w-16" />
                {Array.from({ length: rows }, (_, index) => (
                  <Skeleton key={index} className="h-18 w-full rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <MyPageHeader>
          <h1 className="text-hero">{tNav('my')}</h1>
        </MyPageHeader>
        <PageContainer className={containerClass}>
          <EmptyState
            icon={<UserRound />}
            title={t('errorTitle')}
            description={t('errorDescription')}
            action={
              <Button variant="tint" size="md" onClick={refetch}>
                {tCommon('actions.retry')}
              </Button>
            }
          />
        </PageContainer>
      </>
    );
  }

  if (!user) return <MySignedOut />;

  const name = displayName(user);
  return (
    <>
      <MyPageHeader>
        <div className="flex items-center gap-4 lg:gap-5">
          <UserAvatar name={name} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-hero text-balance break-all">
              {t('greeting', { name })}
            </h1>
            <p className="text-body break-all text-text-secondary">
              {t('provider')}
            </p>
          </div>
        </div>
        <p className="mt-2 text-body text-text-secondary">{t('summary')}</p>
      </MyPageHeader>
      {/** 내 정보 홈은 메뉴 목록이 곧 탐색이라 옆 메뉴를 두지 않는다(하위 화면만 옆 메뉴를 쓴다). */}
      <PageContainer className={cn(containerClass, 'pt-4 lg:pt-6')}>
        <MyMenuList counts={counts} />
      </PageContainer>
    </>
  );
}
