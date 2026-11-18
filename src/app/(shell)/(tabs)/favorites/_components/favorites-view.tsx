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

import { FavoriteList } from './favorite-list';
import { FavoriteListSkeleton } from './favorite-list-skeleton';

export function FavoritesView() {
  const t = useTranslations('library.favorites');
  const tNav = useTranslations('nav');
  return (
    <>
      <MyPageHeader>
        <Breadcrumb>
          <BreadcrumbLink href="/my">{tNav('my')}</BreadcrumbLink>
          <BreadcrumbCurrent>{t('title')}</BreadcrumbCurrent>
        </Breadcrumb>
        <h1 className="text-title">{t('title')}</h1>
        <p className="text-body-sm text-text-secondary">{t('description')}</p>
      </MyPageHeader>
      <PageContainer className="pb-section lg:grid lg:grid-cols-[14rem_1fr] lg:items-start lg:gap-8">
        <MySideNav />
        <LoginRequired reason="favorite" fallback={<FavoriteListSkeleton />}>
          <FavoriteList />
        </LoginRequired>
      </PageContainer>
    </>
  );
}
