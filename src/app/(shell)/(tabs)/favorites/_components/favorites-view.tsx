'use client';

import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
} from '@/components/layout/breadcrumb';
import { PageContainer } from '@/components/layout/page-container';
import { LoginRequired } from '@/features/auth/components/login-required';
import { MyPageHeader } from '@/features/auth/components/my-page-header';
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { useSession } from '@/features/auth/use-session';
import { cn } from '@/lib/utils';

import { FavoriteList } from './favorite-list';
import { FavoriteListSkeleton } from './favorite-list-skeleton';

export function FavoritesView() {
  const t = useTranslations('library.favorites');
  const tNav = useTranslations('nav');
  const { status } = useSession();
  const isListVisible = status === 'authenticated' || status === 'pending';
  return (
    <>
      <MyPageHeader className="to-surface">
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="text-title">{t('title')}</h1>
        <p className="text-body-sm text-text-secondary">{t('description')}</p>
      </MyPageHeader>
      {/** 흰 카드가 잘 보이도록 목록 영역을 회색 띠에 올린다. 로그인 안내처럼 카드가 없는 상태는 흰 판에 둔다. */}
      <div className="flex-1 bg-surface">
        <PageContainer className="pt-4 pb-section md:max-w-2xl lg:grid lg:max-w-page lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8 lg:pt-0">
          <MySideNav />
          <div className={cn(!isListVisible && 'rounded-xl bg-bg')}>
            <LoginRequired
              reason="favorite"
              fallback={<FavoriteListSkeleton />}
            >
              <FavoriteList />
            </LoginRequired>
          </div>
        </PageContainer>
      </div>
    </>
  );
}
