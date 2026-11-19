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
import { MyPageTitle } from '@/features/auth/components/my-page-title';
import { MySideNav } from '@/features/auth/components/my-side-nav';
import { useSession } from '@/features/auth/use-session';

import { FavoriteList } from './favorite-list';
import { FavoriteListSkeleton } from './favorite-list-skeleton';

export function FavoritesView() {
  const t = useTranslations('library.favorites');
  const tNav = useTranslations('nav');
  const isSignedOut = useSession().status === 'anonymous';
  return (
    <>
      <MyPageHeader>
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <MyPageTitle
          title={isSignedOut ? t('signedOutHeading') : t('heading')}
          description={
            isSignedOut ? t('signedOutDescription') : t('description')
          }
        />
      </MyPageHeader>
      <PageContainer className="pb-section md:max-w-2xl lg:grid lg:max-w-page lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-10">
        <MySideNav />
        <div className="min-w-0 lg:max-w-3xl">
          <LoginRequired reason="favorite" fallback={<FavoriteListSkeleton />}>
            <FavoriteList />
          </LoginRequired>
        </div>
      </PageContainer>
    </>
  );
}
